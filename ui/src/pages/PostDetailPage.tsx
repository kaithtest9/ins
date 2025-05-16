// src/pages/PostDetailPage.tsx
import React, { useEffect, useState, type FormEvent } from 'react';
import { useParams, Link as RouterLink, useNavigate, useLocation } from 'react-router-dom';
import apiClient, { type PostResponse,type CommentResponse } from '../api/client';
import CommentCard from '../components/CommentCard';
import { useAuth } from '../contexts/AuthContext';

const PostDetailPage: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const [post, setPost] = useState<PostResponse | null>(null);
  const [comments, setComments] = useState<CommentResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [postError, setPostError] = useState<string | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  
  const [newComment, setNewComment] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);

  const { user, token } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!postId) {
        setPostError("Post ID is missing from URL.");
        setIsLoading(false);
        return;
    }
    const numericPostId = parseInt(postId, 10);
    if (isNaN(numericPostId)) {
        setPostError("Invalid Post ID format.");
        setIsLoading(false);
        return;
    }

    const fetchPostAndComments = async () => {
      setIsLoading(true);
      setPostError(null);
      setCommentError(null);
      try {
        const postData = await apiClient.getPostById(numericPostId);
        setPost(postData);
        const commentsData = await apiClient.getComments(numericPostId);
        setComments(commentsData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())); // Sort newest first
      } catch (err: any) {
        setPostError(err.message || 'Failed to load post details.');
        setPost(null); // Clear post on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchPostAndComments();
  }, [postId]);

  const handleCommentSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!token) {
        setCommentError("You need to be logged in to comment.");
        // Optionally redirect to login, passing current page as 'from'
        // navigate('/auth', { state: { from: location } });
        return;
    }
    if (!post) return; // Should not happen if form is visible
    
    setIsSubmittingComment(true);
    setCommentError(null);
    try {
      const createdComment = await apiClient.createComment(post.id, { text: newComment });
      setComments(prevComments => [createdComment, ...prevComments]); // Add new comment to the top
      setNewComment('');
    } catch (err: any) {
      setCommentError(err.message || 'Failed to submit comment. Please try again.');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  if (isLoading) return <div className="container mx-auto p-4 text-center text-gray-500">Loading post details...</div>;
  if (postError && !post) return <div className="container mx-auto p-4 text-center text-red-500 bg-red-50 border border-red-200 rounded-md">{postError}</div>;
  if (!post) return <div className="container mx-auto p-4 text-center text-gray-600">Post not found.</div>;

  return (
    <div className="container mx-auto p-2 sm:p-4 max-w-4xl"> {/* Responsive padding */}
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden md:flex">
            {/* Image Section */}
            <div className="md:w-1/2 lg:w-3/5 bg-black flex items-center justify-center">
                <img 
                    src={post.imageUrl} 
                    alt={post.caption || 'Post image'} 
                    className="w-full h-auto object-contain max-h-[80vh]" // Object-contain to show full image
                />
            </div>

            {/* Details & Comments Section */}
            <div className="md:w-1/2 lg:w-2/5 p-4 flex flex-col h-full max-h-[80vh]"> {/* Max height for scrolling */}
                {/* Author Info */}
                <div className="flex items-center mb-3 pb-3 border-b border-gray-200">
                    <img 
                        src={post.avatarUrl || `https://ui-avatars.com/api/?name=${post.username}&background=random`} 
                        alt={post.username} 
                        className="w-9 h-9 rounded-full mr-3 object-cover"
                    />
                    <RouterLink to={`/profile/${post.userId}`} className="font-semibold text-sm text-gray-800 hover:underline">
                        {post.username}
                    </RouterLink>
                </div>

                {/* Caption & Date */}
                <div className="mb-3 pr-2 custom-scrollbar overflow-y-auto max-h-28"> {/* Scrollable caption */}
                  {post.caption && (
                      <p className="text-sm text-gray-700 leading-relaxed">
                          <RouterLink to={`/profile/${post.userId}`} className="font-semibold hover:underline mr-1 text-gray-800">
                              {post.username}
                          </RouterLink> 
                          {post.caption}
                      </p>
                  )}
                  <p className="text-xs text-gray-400 mt-2">{new Date(post.createdAt).toLocaleString()}</p>
                </div>
                

                {/* Comments List */}
                <div className="flex-grow overflow-y-auto mb-4 pr-2 custom-scrollbar border-t border-gray-200 pt-3">
                    <h3 className="text-md font-semibold text-gray-700 mb-2">Comments ({comments.length})</h3>
                    {commentError && <p className="text-red-500 text-xs mb-2">{commentError}</p>}
                    {comments.length > 0 ? (
                        comments.map(comment => <CommentCard key={comment.id} comment={comment} />)
                    ) : (
                        <p className="text-gray-500 text-sm">No comments yet. Be the first to comment!</p>
                    )}
                </div>
                
                {/* Add Comment Form */}
                <div className="mt-auto border-t border-gray-200 pt-3">
                  {token ? (
                      <form onSubmit={handleCommentSubmit}>
                        <textarea
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Add a comment..."
                            className="w-full p-2 border border-gray-300 rounded-md text-sm focus:ring-pink-500 focus:border-pink-500 resize-none"
                            rows={2}
                            required
                        />
                        <button 
                            type="submit" 
                            disabled={isSubmittingComment || !newComment.trim()}
                            className="mt-2 w-full bg-pink-500 text-white py-2 px-3 rounded-md hover:bg-pink-600 disabled:bg-pink-300 text-sm font-medium transition duration-150"
                        >
                            {isSubmittingComment ? 'Posting...' : 'Post Comment'}
                        </button>
                      </form>
                  ) : (
                      <p className="text-sm text-gray-600">
                          <RouterLink to="/auth" state={{ from: location }} className="text-pink-600 hover:underline font-medium">
                              Log in
                          </RouterLink> or <RouterLink to="/auth" state={{ from: location }} className="text-pink-600 hover:underline font-medium">
                              Sign up
                          </RouterLink> to post a comment.
                      </p>
                  )}
                </div>
            </div>
        </div>
        {/* Simple custom scrollbar (optional) */}
        <style>{`
            .custom-scrollbar::-webkit-scrollbar {
                width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background-color: #dbdbdb;
                border-radius: 3px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background-color: #f0f0f0;
            }
        `}</style>
    </div>
  );
};

export default PostDetailPage;