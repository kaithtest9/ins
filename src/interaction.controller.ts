import { Post, Delete, Route, Tags, Security, Request, Path, Body, Controller, Res, TsoaResponse, SuccessResponse, Get, Query } from 'tsoa';
import { db, likes, comments, posts as postsTable, users } from './db'; // Renamed 'posts' to 'postsTable' to avoid conflict
import { eq, and, desc } from 'drizzle-orm';
import type { JwtPayload } from './utils';

export interface CreateCommentInput {
  text: string;
}
export interface CommentResponse {
    id: number;
    text: string;
    userId: number;
    postId: number;
    username: string; // Added for convenience
    avatarUrl: string | null; // Added for convenience
    createdAt: Date;
}


@Route('posts/{postId}')
@Tags('Interactions (Likes & Comments)')
export class InteractionController extends Controller {
  @Security('jwt')
  @SuccessResponse(201, 'Liked')
  @Post('like')
  public async likePost(
    @Request() req: Express.Request,
    @Path() postId: number,
    @Res() notFoundResponse: TsoaResponse<404, { message: string }>,
    @Res() conflictResponse: TsoaResponse<409, { message: string }>,
    @Res() badRequestResponse: TsoaResponse<400, { message: string }>
  ): Promise<{ message: string }> {
    const currentUser = req.user as JwtPayload;

    const postExists = await db.query.posts.findFirst({ where: eq(postsTable.id, postId) });
    if (!postExists) {
        return notFoundResponse(404, { message: "Post not found." });
    }

    try {
        await db.insert(likes).values({ userId: currentUser.userId, postId: postId });
        this.setStatus(201);
        return { message: 'Post liked successfully' };
    } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
            return conflictResponse(409, { message: 'Post already liked by this user.' });
        }
        console.error("Like error:", error);
        return badRequestResponse(400, { message: 'Failed to like post.' });
    }
  }

  @Security('jwt')
  @SuccessResponse(200, 'Unliked')
  @Delete('unlike')
  public async unlikePost(
    @Request() req: Express.Request,
    @Path() postId: number,
    @Res() notFoundResponse: TsoaResponse<404, { message: string }>
  ): Promise<{ message: string }> {
    const currentUser = req.user as JwtPayload;
    const result = await db.delete(likes).where(
      and(eq(likes.userId, currentUser.userId), eq(likes.postId, postId))
    ).returning();

    if (result.length === 0) {
        return notFoundResponse(404, { message: "Like not found or post does not exist." });
    }
    this.setStatus(200);
    return { message: 'Post unliked successfully' };
  }

  @Security('jwt')
  @SuccessResponse(201, 'Comment Created')
  @Post('comments')
  public async createComment(
    @Request() req: Express.Request,
    @Path() postId: number,
    @Body() body: CreateCommentInput,
    @Res() notFoundResponse: TsoaResponse<404, { message: string }>
  ): Promise<CommentResponse> {
    const currentUser = req.user as JwtPayload;

    const postExists = await db.query.posts.findFirst({ where: eq(postsTable.id, postId) });
    if (!postExists) {
        return notFoundResponse(404, { message: "Post not found." });
    }

    const [newComment] = await db.insert(comments)
      .values({ userId: currentUser.userId, postId: postId, text: body.text })
      .returning();

    this.setStatus(201);
    return {
        ...newComment,
        username: currentUser.username, // Or fetch fresh user data
        avatarUrl: null // Placeholder
    };
  }

  @Get('comments')
  public async getComments(
    @Path() postId: number,
    @Query() limit: number = 10,
    @Query() offset: number = 0,
    @Res() notFoundResponse: TsoaResponse<404, { message: string }>
  ): Promise<CommentResponse[]> {
    const postExists = await db.query.posts.findFirst({ where: eq(postsTable.id, postId) });
    if (!postExists) {
        return notFoundResponse(404, { message: "Post not found." });
    }

    const results = await db.select({
        id: comments.id,
        text: comments.text,
        createdAt: comments.createdAt,
        userId: comments.userId,
        postId: comments.postId,
        username: users.username,
        avatarUrl: users.avatarUrl
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt))
    .limit(limit)
    .offset(offset);

    return results;
  }
}