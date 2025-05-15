CREATE SCHEMA "ins";
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ins"."ins_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ins"."ins_follows" (
	"follower_id" integer NOT NULL,
	"following_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ins_follows_follower_id_following_id_pk" PRIMARY KEY("follower_id","following_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ins"."ins_likes" (
	"user_id" integer NOT NULL,
	"post_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ins_likes_user_id_post_id_pk" PRIMARY KEY("user_id","post_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ins"."ins_posts" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"image_url" text NOT NULL,
	"caption" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"search_vector" "tsvector"
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "ins"."ins_users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" text NOT NULL,
	"bio" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ins_users_username_unique" UNIQUE("username"),
	CONSTRAINT "ins_users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ins"."ins_comments" ADD CONSTRAINT "ins_comments_user_id_ins_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ins"."ins_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ins"."ins_comments" ADD CONSTRAINT "ins_comments_post_id_ins_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "ins"."ins_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ins"."ins_follows" ADD CONSTRAINT "ins_follows_follower_id_ins_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "ins"."ins_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ins"."ins_follows" ADD CONSTRAINT "ins_follows_following_id_ins_users_id_fk" FOREIGN KEY ("following_id") REFERENCES "ins"."ins_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ins"."ins_likes" ADD CONSTRAINT "ins_likes_user_id_ins_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ins"."ins_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ins"."ins_likes" ADD CONSTRAINT "ins_likes_post_id_ins_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "ins"."ins_posts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "ins"."ins_posts" ADD CONSTRAINT "ins_posts_user_id_ins_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "ins"."ins_users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ins_comments_post_user_idx" ON "ins"."ins_comments" ("post_id","user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ins_follows_following_id_idx" ON "ins"."ins_follows" ("following_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ins_posts_user_id_idx" ON "ins"."ins_posts" ("user_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ins_posts_search_vector_idx" ON "ins"."ins_posts" ("search_vector");