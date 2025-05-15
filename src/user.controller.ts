import { Post, Delete, Route, Tags, Security, Request, Path, Controller, Res, TsoaResponse, Get, SuccessResponse } from 'tsoa';
import { db, follows, users } from './db';
import { eq, and, sql } from 'drizzle-orm';
import type { JwtPayload } from './utils'; // Ensure this type is correctly imported

@Route('users')
@Tags('Users & Follows')
export class UserController extends Controller {
  @Security('jwt')
  @SuccessResponse(201, 'Followed')
  @Post('{userIdToFollow}/follow')
  public async followUser(
    @Request() req: Express.Request, // Use Express.Request for tsoa to inject req.user
    @Path() userIdToFollow: number,
    @Res() notFoundResponse: TsoaResponse<404, { message: string }>,
    @Res() conflictResponse: TsoaResponse<409, { message: string }>,
    @Res() badRequestResponse: TsoaResponse<400, { message: string }>
  ): Promise<{ message: string }> {
    const currentUser = req.user as JwtPayload;
    if (currentUser.userId === userIdToFollow) {
        return badRequestResponse(400, { message: "You cannot follow yourself." });
    }

    const userToFollowExists = await db.query.users.findFirst({ where: eq(users.id, userIdToFollow) });
    if (!userToFollowExists) {
        return notFoundResponse(404, { message: "User to follow not found." });
    }

    try {
        await db.insert(follows).values({
            followerId: currentUser.userId,
            followingId: userIdToFollow,
        });
        this.setStatus(201);
        return { message: `Successfully followed user ${userIdToFollow}` };
    } catch (error: any) {
        // Check for unique constraint violation (already following)
        if (error.code === '23505') { // PostgreSQL unique violation code
            return conflictResponse(409, { message: "You are already following this user." });
        }
        console.error("Follow error:", error);
        return badRequestResponse(400, { message: "Could not follow user." });
    }
  }

  @Security('jwt')
  @SuccessResponse(200, 'Unfollowed')
  @Delete('{userIdToUnfollow}/unfollow')
  public async unfollowUser(
    @Request() req: Express.Request,
    @Path() userIdToUnfollow: number,
    @Res() notFoundResponse: TsoaResponse<404, { message: string }>
  ): Promise<{ message: string }> {
    const currentUser = req.user as JwtPayload;
    const result = await db.delete(follows).where(
      and(
        eq(follows.followerId, currentUser.userId),
        eq(follows.followingId, userIdToUnfollow)
      )
    ).returning(); // Check if a row was actually deleted

    if (result.length === 0) {
        return notFoundResponse(404, { message: "Follow relationship not found or user does not exist." });
    }
    this.setStatus(200);
    return { message: `Successfully unfollowed user ${userIdToUnfollow}` };
  }

  @Get('{userId}/profile')
  public async getUserProfile(
    @Path() userId: number,
    @Res() notFoundResponse: TsoaResponse<404, { message: string }>
  ): Promise<any> { // Define a proper UserProfileResponse interface
    const userProfile = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: { id: true, username: true, bio: true, avatarUrl: true, createdAt: true }
    });

    if (!userProfile) {
        return notFoundResponse(404, { message: 'User not found' });
    }

    // Example: Get follower and following counts
    const followerCount = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followingId, userId));
    const followingCount = await db.select({ count: sql<number>`count(*)` }).from(follows).where(eq(follows.followerId, userId));

    return {
        ...userProfile,
        followers: followerCount[0]?.count || 0,
        following: followingCount[0]?.count || 0,
    };
  }
}