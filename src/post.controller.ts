import {
  Body,
  Get,
  Post,
  Route,
  Tags,
  Security,
  Request,
  Path,
  Query,
  Controller,
  Res,
  TsoaResponse,
  SuccessResponse,
} from "tsoa";
import { db, posts, users, customSchema } from "./db"; // customSchema jika Anda menggunakannya
import { eq, desc, sql } from "drizzle-orm";
import type { JwtPayload } from "./utils";
import { uploadBase64ToS3, getPublicS3Url } from "./s3.service"; // Import fungsi baru

// Input untuk membuat post baru via Base64
export interface CreatePostBase64Input {
  /**
   * Base64 encoded image data.
   * Penting: String ini TIDAK BOLEH menyertakan prefix data URI (misalnya, 'data:image/jpeg;base64,').
   * Kirim hanya bagian data base64 murninya.
   */
  imageBase64: string;
  /**
   * MIME type dari gambar, contoh: "image/jpeg", "image/png".
   * Ini penting untuk S3 agar bisa mengatur ContentType dengan benar.
   */
  imageFileType: string;
  caption?: string;
}

export interface PostResponse {
  id: number;
  imageUrl: string; // Ini akan menjadi URL S3 publik
  caption: string | null;
  createdAt: Date;
  userId: number;
  username: string;
  avatarUrl: string | null;
}

// PresignedUrlRequest tidak lagi diperlukan
// export interface PresignedUrlRequest { ... }

@Route("posts")
@Tags("Posts") // Tag bisa tetap atau diubah jika perlu
export class PostController extends Controller {
  // Endpoint GET /upload-url tidak lagi diperlukan dan telah dihapus.
  // @Security('jwt')
  // @Get('upload-url')
  // public async getPresignedS3Url(...) { ... }

  @Security("jwt")
  @Post('') // Endpoint untuk membuat post tetap sama (POST /api/v1/posts)
  @SuccessResponse(201, "Post Created")
  public async createPost(
    @Request() req: Express.Request,
    @Body() body: CreatePostBase64Input, // Menggunakan input interface baru
    @Res() badRequestResponse: TsoaResponse<400, { message: string }>,
    @Res() serverErrorResponse: TsoaResponse<500, { message: string }>
  ): Promise<PostResponse> {
    console.log("Request body:", body);
    const currentUser = req.user as JwtPayload;

    if (!body.imageBase64 || !body.imageFileType) {
      return badRequestResponse(400, {
        message: "imageBase64 and imageFileType are required.",
      });
    }

    // Validasi sederhana untuk imageFileType (bisa diperluas)
    if (!body.imageFileType.startsWith("image/")) {
      return badRequestResponse(400, {
        message:
          "Invalid imageFileType. Must be like 'image/jpeg' or 'image/png'.",
      });
    }
    // Memeriksa apakah base64 string mengandung prefix data URI dan menghapusnya jika ada.
    // Namun, instruksi di atas meminta klien untuk mengirim data base64 murni.
    // Jika Anda ingin lebih toleran:
    let base64Data = body.imageBase64;
    const base64PrefixMatch = body.imageBase64.match(
      /^data:(image\/\w+);base64,/
    );
    if (base64PrefixMatch) {
      // Jika klien mengirim prefix, kita bisa coba ekstrak data murninya.
      // Dan idealnya, gunakan fileType dari prefix jika ada, untuk validasi.
      // if (body.imageFileType !== base64PrefixMatch[1]) {
      //     return badRequestResponse(400, { message: "imageFileType does not match base64 data prefix." });
      // }
      base64Data = body.imageBase64.substring(base64PrefixMatch[0].length);
    }

    console.log("Base64 data length:", base64Data.length);

    try {
      // 1. Upload gambar base64 ke S3
      const s3UploadResult = await uploadBase64ToS3(
        base64Data,
        body.imageFileType
      );

      console.log("S3 upload result:", s3UploadResult);

      // 2. Simpan informasi post ke database dengan URL S3
      const [newPost] = await db
        .insert(posts) // 'posts' adalah objek skema dari db.ts
        .values({
          userId: currentUser.userId,
          imageUrl: s3UploadResult.s3ObjectUrl, // Simpan URL S3 publik
          caption: body.caption,
        })
        .returning();

      const userProfile = await db.query.users.findFirst({
        // 'users' adalah objek skema
        where: eq(users.id, currentUser.userId),
        columns: { username: true, avatarUrl: true },
      });

      this.setStatus(201);
      return {
        ...newPost,
        username: userProfile?.username || "unknown",
        avatarUrl: userProfile?.avatarUrl || null,
      };
    } catch (error: any) {
      console.error("Error creating post with base64 image:", error);
      // Jika error berasal dari s3.service atau validasi lain
      if (
        error.message.includes("S3") ||
        error.message.includes("configured")
      ) {
        return serverErrorResponse(500, {
          message: `Failed to process image: ${error.message}`,
        });
      }
      return serverErrorResponse(500, {
        message: error.message || "Failed to create post.",
      });
    }
  }

  // Metode GET (getFeedPosts, searchPosts, getPostById) tetap sama
  // karena mereka mengambil data yang sudah ada, dan imageUrl di DB sekarang
  // akan menjadi URL S3 yang valid.

  @Get("")
  public async getFeedPosts(
    @Query() limit: number = 10,
    @Query() offset: number = 0
  ): Promise<PostResponse[]> {
    const results = await db
      .select({
        id: posts.id,
        imageUrl: posts.imageUrl,
        caption: posts.caption,
        createdAt: posts.createdAt,
        userId: posts.userId,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .orderBy(desc(posts.createdAt))
      .limit(limit)
      .offset(offset);
    return results;
  }

  @Get("search")
  public async searchPosts(
    @Query() query: string,
    @Query() limit: number = 10,
    @Query() offset: number = 0,
    @Res() badRequestResponse: TsoaResponse<400, { message: string }>
  ): Promise<PostResponse[]> {
    if (!query || query.trim() === "") {
      return badRequestResponse(400, {
        message: "Search query cannot be empty",
      });
    }
    const searchTerm = query.trim().split(/\s+/).filter(Boolean).join(" & ");

    const results = await db
      .select({
        id: posts.id,
        imageUrl: posts.imageUrl,
        caption: posts.caption,
        createdAt: posts.createdAt,
        userId: posts.userId,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(
        sql`"${customSchema.schemaName}".ins_posts.search_vector @@ plainto_tsquery('english', ${searchTerm})`
      )
      .orderBy(
        sql`ts_rank_cd("${customSchema.schemaName}".ins_posts.search_vector, plainto_tsquery('english', ${searchTerm})) DESC`
      )
      .limit(limit)
      .offset(offset);
    return results;
  }

  @Get("{postId}")
  public async getPostById(
    @Path() postId: number,
    @Res() notFoundResponse: TsoaResponse<404, { message: string }>
  ): Promise<PostResponse> {
    const result = await db
      .select({
        id: posts.id,
        imageUrl: posts.imageUrl,
        caption: posts.caption,
        createdAt: posts.createdAt,
        userId: posts.userId,
        username: users.username,
        avatarUrl: users.avatarUrl,
      })
      .from(posts)
      .innerJoin(users, eq(posts.userId, users.id))
      .where(eq(posts.id, postId))
      .limit(1);

    if (result.length === 0) {
      return notFoundResponse(404, { message: "Post not found" });
    }
    return result[0];
  }
}
