import { relations } from "drizzle-orm/relations";
import { insUsersInIns, insCommentsInIns, insPostsInIns, insFollowsInIns, insLikesInIns } from "./schema";

export const insCommentsInInsRelations = relations(insCommentsInIns, ({one}) => ({
	insUsersInIn: one(insUsersInIns, {
		fields: [insCommentsInIns.userId],
		references: [insUsersInIns.id]
	}),
	insPostsInIn: one(insPostsInIns, {
		fields: [insCommentsInIns.postId],
		references: [insPostsInIns.id]
	}),
}));

export const insUsersInInsRelations = relations(insUsersInIns, ({many}) => ({
	insCommentsInIns: many(insCommentsInIns),
	insPostsInIns: many(insPostsInIns),
	insFollowsInIns_followerId: many(insFollowsInIns, {
		relationName: "insFollowsInIns_followerId_insUsersInIns_id"
	}),
	insFollowsInIns_followingId: many(insFollowsInIns, {
		relationName: "insFollowsInIns_followingId_insUsersInIns_id"
	}),
	insLikesInIns: many(insLikesInIns),
}));

export const insPostsInInsRelations = relations(insPostsInIns, ({one, many}) => ({
	insCommentsInIns: many(insCommentsInIns),
	insUsersInIn: one(insUsersInIns, {
		fields: [insPostsInIns.userId],
		references: [insUsersInIns.id]
	}),
	insLikesInIns: many(insLikesInIns),
}));

export const insFollowsInInsRelations = relations(insFollowsInIns, ({one}) => ({
	insUsersInIn_followerId: one(insUsersInIns, {
		fields: [insFollowsInIns.followerId],
		references: [insUsersInIns.id],
		relationName: "insFollowsInIns_followerId_insUsersInIns_id"
	}),
	insUsersInIn_followingId: one(insUsersInIns, {
		fields: [insFollowsInIns.followingId],
		references: [insUsersInIns.id],
		relationName: "insFollowsInIns_followingId_insUsersInIns_id"
	}),
}));

export const insLikesInInsRelations = relations(insLikesInIns, ({one}) => ({
	insUsersInIn: one(insUsersInIns, {
		fields: [insLikesInIns.userId],
		references: [insUsersInIns.id]
	}),
	insPostsInIn: one(insPostsInIns, {
		fields: [insLikesInIns.postId],
		references: [insPostsInIns.id]
	}),
}));