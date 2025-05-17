// src/api/client.ts
export interface User {
  id: number;
  username: string;
  email: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface PostResponse {
  id: number;
  imageUrl: string;
  caption?: string | null;
  createdAt: string;
  userId: number;
  username: string;
  avatarUrl?: string | null;
}

export interface CreatePostBase64Input {
  imageBase64: string;
  imageFileType: string;
  caption?: string;
}

export interface CommentResponse {
  id: number;
  text: string;
  userId: number;
  postId: number;
  username: string;
  avatarUrl?: string | null;
  createdAt: string;
}

export interface CreateCommentInput {
  text: string;
}

export interface UserPublicProfile {
    id: number;
    username: string;
    email: string;
    posts?: PostResponse[]; // 假设个人资料可能包含用户的帖子
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


const API_BASE_URL = '/api/v1'; // Vite会代理这个路径

const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return token ? { 'Authorization': `Bearer ${token}` } : {'Authorization': ''};
};

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: `HTTP error! status: ${response.status}` }));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }
  return response.json();
};

const apiClient = {
  register: async (data: UserRegistrationInput): Promise<UserPublicProfile> => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  login: async (data: UserLoginInput): Promise<AuthResponse> => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getFeedPosts: async (limit = 10, offset = 0): Promise<PostResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/posts?limit=${limit}&offset=${offset}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  searchPosts: async (query: string, limit = 10, offset = 0): Promise<PostResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/posts/search?query=${encodeURIComponent(query)}&limit=${limit}&offset=${offset}`, {
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createPost: async (data: CreatePostBase64Input): Promise<PostResponse> => {
    const response = await fetch(`${API_BASE_URL}/posts`, {
      method: 'POST',
      headers: {
        ...getAuthHeaders(), // 包含认证 token
        'Content-Type': 'application/json', // 设置 Content-Type 为 JSON
      },
      body: JSON.stringify(data), // 将数据对象序列化为 JSON 字符串
    });
    return handleResponse(response); // handleResponse 假设你已经定义了
  },

  getUserProfile: async (userId: number): Promise<UserPublicProfile> => {
    // Swagger 中此接口响应 schema 为空 {}，这里假设它至少返回用户基本信息
    // 你可能需要调整此处的 UserPublicProfile 定义或 API 响应
    const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
    // 如果需要同时获取用户帖子，你可能需要另一个接口或修改此接口的后端实现
  },

   getPostsByUserId: async (userId: number, limit = 10, offset = 0): Promise<PostResponse[]> => {
    // 这是一个假设的API端点，因为Swagger中没有明确列出按用户ID获取帖子的接口
    // 你可能需要自己实现这个后端接口，或者调整现有接口
    // 作为临时方案，可以获取所有帖子再在前端过滤，但不推荐用于生产环境
    // 例如: GET /users/{userId}/posts
    // const response = await fetch(`${API_BASE_URL}/users/${userId}/posts?limit=${limit}&offset=${offset}`, {
    //   headers: getAuthHeaders(),
    // });
    // return handleResponse(response);

    // 临时方案: 获取feed并过滤 (效率较低)
    console.warn("Using inefficient getPostsByUserId method. Consider a dedicated API endpoint.");
    const allPosts = await apiClient.getFeedPosts(1000, 0); // 获取大量帖子
    return allPosts.filter(post => post.userId === userId).slice(offset, offset + limit);
  },


  getPostById: async (postId: number): Promise<PostResponse> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getComments: async (postId: number, limit = 10, offset = 0): Promise<CommentResponse[]> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments?limit=${limit}&offset=${offset}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  createComment: async (postId: number, data: CreateCommentInput): Promise<CommentResponse> => {
    const response = await fetch(`${API_BASE_URL}/posts/${postId}/comments`, {
      method: 'POST',
      headers: { ...getAuthHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  followUser: async (userIdToFollow: number): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/users/${userIdToFollow}/follow`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  unfollowUser: async (userIdToUnfollow: number): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/users/${userIdToUnfollow}/unfollow`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },
  // 可以在这里添加 Like/Unlike 的 API 调用
  // likePost: async (postId: number): Promise<{ message: string }> => { ... }
  // unlikePost: async (postId: number): Promise<{ message: string }> => { ... }
};

export default apiClient;