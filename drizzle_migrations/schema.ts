import { pgTable, pgSchema, unique, serial, varchar, text, timestamp, index, foreignKey, integer, primaryKey } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

export const ins = pgSchema("ins");


export const insUsersInIns = ins.table("ins_users", {
	id: serial().primaryKey().notNull(),
	username: varchar({ length: 50 }).notNull(),
	email: varchar({ length: 255 }).notNull(),
	passwordHash: text("password_hash").notNull(),
	bio: text(),
	avatarUrl: text("avatar_url"),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	unique("ins_users_username_unique").on(table.username),
	unique("ins_users_email_unique").on(table.email),
]);

export const insCommentsInIns = ins.table("ins_comments", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	postId: integer("post_id").notNull(),
	text: text().notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ins_comments_post_user_idx").using("btree", table.postId.asc().nullsLast().op("int4_ops"), table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [insUsersInIns.id],
			name: "ins_comments_user_id_ins_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [insPostsInIns.id],
			name: "ins_comments_post_id_ins_posts_id_fk"
		}).onDelete("cascade"),
]);

export const insPostsInIns = ins.table("ins_posts", {
	id: serial().primaryKey().notNull(),
	userId: integer("user_id").notNull(),
	imageUrl: text("image_url").notNull(),
	caption: text(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
	// TODO: failed to parse database type 'tsvector'
	searchVector: unknown("search_vector"),
}, (table) => [
	index("ins_posts_search_vector_idx2").using("gin", sql`to_tsvector('english'::regconfig, caption)`),
	index("ins_posts_user_id_idx").using("btree", table.userId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.userId],
			foreignColumns: [insUsersInIns.id],
			name: "ins_posts_user_id_ins_users_id_fk"
		}).onDelete("cascade"),
]);

export const insFollowsInIns = ins.table("ins_follows", {
	followerId: integer("follower_id").notNull(),
	followingId: integer("following_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	index("ins_follows_following_id_idx").using("btree", table.followingId.asc().nullsLast().op("int4_ops")),
	foreignKey({
			columns: [table.followerId],
			foreignColumns: [insUsersInIns.id],
			name: "ins_follows_follower_id_ins_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.followingId],
			foreignColumns: [insUsersInIns.id],
			name: "ins_follows_following_id_ins_users_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.followerId, table.followingId], name: "ins_follows_follower_id_following_id_pk"}),
]);

export const insLikesInIns = ins.table("ins_likes", {
	userId: integer("user_id").notNull(),
	postId: integer("post_id").notNull(),
	createdAt: timestamp("created_at", { withTimezone: true, mode: 'string' }).defaultNow().notNull(),
}, (table) => [
	foreignKey({
			columns: [table.userId],
			foreignColumns: [insUsersInIns.id],
			name: "ins_likes_user_id_ins_users_id_fk"
		}).onDelete("cascade"),
	foreignKey({
			columns: [table.postId],
			foreignColumns: [insPostsInIns.id],
			name: "ins_likes_post_id_ins_posts_id_fk"
		}).onDelete("cascade"),
	primaryKey({ columns: [table.userId, table.postId], name: "ins_likes_user_id_post_id_pk"}),
]);
