// src/components/PostCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import { type PostResponse } from '../api/client';

interface PostCardProps {
  post: PostResponse;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-6">
      <div className="p-3 flex items-center border-b border-gray-100">
        <img 
          src={post.avatarUrl || `https://ui-avatars.com/api/?name=${post.username}&background=random`} 
          alt={post.username} 
          className="w-9 h-9 rounded-full mr-3 object-cover"
        />
        <Link to={`/profile/${post.userId}`} className="font-semibold text-sm text-gray-800 hover:underline">
          {post.username}
        </Link>
      </div>
      <Link to={`/post/${post.id}`}>
        <img 
          src={post.imageUrl} 
          alt={post.caption || 'Instagram post'} 
          className="w-full h-auto object-cover bg-gray-100" 
          style={{aspectRatio: '1/1', maxHeight: '600px'}} // Enforce square or limit height
        />
      </Link>
      <div className="p-4">
        {post.caption && (
          <p className="mb-2 text-sm">
            <Link to={`/profile/${post.userId}`} className="font-semibold hover:underline mr-1">
              {post.username}
            </Link> 
            {post.caption}
          </p>
        )}
        <Link to={`/post/${post.id}`} className="text-xs text-gray-500 hover:underline">
          View details and comments
        </Link>
        <p className="text-xs text-gray-400 mt-1">{new Date(post.createdAt).toLocaleDateString()}</p>
      </div>
      {/* Future: Add Like button and comment count here */}
    </div>
  );
};

export default PostCard;