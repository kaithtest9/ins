// src/pages/FeedPage.tsx
import React, { useEffect, useState } from 'react';
import apiClient, { type PostResponse } from '../api/client';
import PostCard from '../components/PostCard';
import CreatePostForm from '../components/CreatePostForm';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';


interface FeedPageProps {
  searchQuery?: string;
}

const FeedPage: React.FC<FeedPageProps> = ({ searchQuery }) => {
  const [posts, setPosts] = useState<PostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, token } = useAuth();

  useEffect(() => {
    const fetchPosts = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const fetchedPosts = searchQuery 
          ? await apiClient.searchPosts(searchQuery)
          : await apiClient.getFeedPosts();
        
        setPosts(fetchedPosts);
        if (searchQuery && fetchedPosts.length === 0) {
            setError(`No posts found matching "${searchQuery}".`);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch posts. Please try again later.');
        setPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPosts();
  }, [searchQuery, token]); // Re-fetch if searchQuery changes or user logs in/out (for create post form visibility)

  const handlePostCreated = (newPost: PostResponse) => {
    setPosts(prevPosts => [newPost, ...prevPosts]); // Add new post to the top
    window.scrollTo(0, 0); // Scroll to top to see the new post
  };

  if (isLoading) {
    return <div className="container mx-auto p-4 text-center text-gray-500">Loading posts...</div>;
  }

  return (
    <div className="container mx-auto p-4 max-w-lg"> {/* Max width for feed */}
      {searchQuery && (
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Search Results for: <span className="text-pink-600">"{searchQuery}"</span>
        </h1>
      )}
      
      {!searchQuery && user && (
        <CreatePostForm onPostCreated={handlePostCreated} />
      )}
       {!searchQuery && !user && (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-sm mb-6 text-center">
            <p className="text-gray-600">
                <Link to="/auth" className="text-pink-600 font-semibold hover:underline">Log in</Link> or <Link to="/auth" className="text-pink-600 font-semibold hover:underline">Sign up</Link> to create posts and interact.
            </p>
        </div>
      )}

      {error && <p className="text-red-500 text-center mb-4 bg-red-50 p-3 rounded-md border border-red-200">{error}</p>}

      {posts.length > 0 ? (
        posts.map(post => <PostCard key={post.id} post={post} />)
      ) : (
        !isLoading && !error && (
          <p className="text-center text-gray-500 py-10">
            {searchQuery ? 'No results found.' : 'No posts in your feed yet. Follow users or create your first post!'}
          </p>
        )
      )}
    </div>
  );
};

export default FeedPage;