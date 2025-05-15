import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import {
  pgTable,
  serial,
  varchar,
  timestamp,
  text,
  integer,
  primaryKey,
  customType,
  index,
  pgSchema
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';
import appConfig from './config';

const tsvector = customType<{ data: string; driverData: string }>({
  dataType() {
    return 'tsvector';
  },
});

export const customSchema = pgSchema("ins")

// --- Schema Definition with 'ins_' prefix ---
// 变量名保持不变 (users, posts 等)，方便代码其他部分引用
// 但实际SQL表名已改为 'ins_users', 'ins_posts' 等

export const users = customSchema.table('ins_users', { // Prefixed
  id: serial('id').primaryKey(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  bio: text('bio'),
  avatarUrl: text('avatar_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const posts = customSchema.table('ins_posts', { // Prefixed
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }), // Drizzle handles foreign key to 'ins_users'
  imageUrl: text('image_url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  searchVector: tsvector('search_vector'),
}, (table) => ({
  userIdx: index('ins_posts_user_id_idx').on(table.userId), // Index name also prefixed for clarity
  searchVectorIdx: index('ins_posts_search_vector_idx').on(table.searchVector).using(sql`gin`),
}));

/*
  Trigger for searchVector (Updated for 'ins_posts' table):
  --------------------------------------------------------------------
  -- Drop the old trigger and function if they exist for the 'posts' table before creating new ones for 'ins_posts'
  -- DROP TRIGGER IF EXISTS posts_search_vector_update ON posts;
  -- DROP FUNCTION IF EXISTS update_posts_search_vector();

  CREATE OR REPLACE FUNCTION update_ins_posts_search_vector() -- Renamed function
  RETURNS TRIGGER AS $$
  BEGIN
    NEW.search_vector = to_tsvector('pg_catalog.english', COALESCE(NEW.caption, ''));
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER ins_posts_search_vector_update -- Renamed trigger
  BEFORE INSERT OR UPDATE ON ins_posts -- Updated table name
  FOR EACH ROW
  EXECUTE FUNCTION update_ins_posts_search_vector(); -- Updated function name
  --------------------------------------------------------------------
  -- IMPORTANT: This SQL trigger needs to be applied to your PostgreSQL database manually
  -- or as a custom step after Drizzle migrations run.
*/

export const comments = customSchema.table('ins_comments', { // Prefixed
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }), // Drizzle handles FKs to 'ins_posts'
  text: text('text').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  postUserIdx: index('ins_comments_post_user_idx').on(table.postId, table.userId),
}));

export const likes = customSchema.table('ins_likes', { // Prefixed
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  postId: integer('post_id').notNull().references(() => posts.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.postId] }), // Composite key, name doesn't need prefix in Drizzle schema
}));

export const follows = customSchema.table('ins_follows', { // Prefixed
  followerId: integer('follower_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  followingId: integer('following_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.followerId, table.followingId] }),
  followingIdx: index('ins_follows_following_id_idx').on(table.followingId),
}));


// --- Drizzle Client ---
const pool = new Pool({
  connectionString: appConfig.DATABASE_URL,
});

// The schema objects (users, posts, etc.) are what you import and use in your queries.
// Drizzle ORM maps these objects to the actual table names ('ins_users', 'ins_posts') internally.
export const db = drizzle(pool, { schema: { users, posts, comments, likes, follows } });