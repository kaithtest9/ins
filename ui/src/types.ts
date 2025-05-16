// src/types.ts

// Based on your Swagger
export interface User {
  id: number;
  username: string;
  email: string;
  avatarUrl?: string | null; // Assuming avatar might be part of user object
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserPublicProfile {
  id: number;
  username: string;
  email: string;
}

export interface PostResponse {
  id: number;
  imageUrl: string;
  caption?: string | null;
  createdAt: string; // ISO Date string
  userId: number;
  username: string;
  avatarUrl?: string | null;
}

export interface CommentResponse {
  id: number;
  text: string;
  userId: number;
  postId: number;
  username: string;
  avatarUrl?: string | null;
  createdAt: string; // ISO Date string
}

export interface CreateCommentInput {
  text: string;
}

export interface UserRegistrationInput {
  username: string;
  email: string;
  password: string;
}

export interface UserLoginInput {
  email: string;
  password: string;
}