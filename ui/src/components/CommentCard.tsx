// src/components/CommentCard.tsx
import React from 'react';
import { Link } from 'react-router-dom';
import type { CommentResponse } from '../api/client';

interface CommentCardProps {
  comment: CommentResponse;
}

const CommentCard: React.FC<CommentCardProps> = ({ comment }) => {
  return (
    <div className="py-2 flex items-start space-x-2">
      <img 
        src={comment.avatarUrl || `https://ui-avatars.com/api/?name=${comment.username}&background=random&size=32`} 
        alt={comment.username} 
        className="w-8 h-8 rounded-full mt-0.5 object-cover"
      />
      <div className="text-sm">
        <p>
          <Link to={`/profile/${comment.userId}`} className="font-semibold hover:underline text-gray-800">
            {comment.username}
          </Link>
          <span className="ml-1.5 text-gray-700">{comment.text}</span>
        </p>
        <p className="text-xs text-gray-400 mt-0.5">{new Date(comment.createdAt).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default CommentCard;