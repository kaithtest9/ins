// src/pages/UserProfilePage.tsx
import React, { useEffect, useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import apiClient, { type UserPublicProfile, type PostResponse as UserPostResponse } from '../api/client';
// import PostCard from '../components/PostCard'; // Could use PostCard or a simpler grid item
import { useAuth } from '../contexts/AuthContext';

const UserProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const [profile, setProfile] = useState<UserPublicProfile | null>(null);
  const [userPosts, setUserPosts] = useState<UserPostResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser, token } = useAuth();
  
  const [isFollowing, setIsFollowing] = useState(false); // This needs to be fetched from API
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!userId) {
        setError("User ID is missing.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const numericUserId = parseInt(userId, 10);
        if (isNaN(numericUserId)) {
            setError("Invalid User ID format.");
            setIsLoading(false);
            return;
        }
        const profileData = await apiClient.getUserProfile(numericUserId);
        setProfile(profileData);

        // Fetch posts by this user
        // Using the placeholder getPostsByUserId from apiClient.ts
        // Replace with your actual API endpoint if available.
        const postsData = await apiClient.getPostsByUserId(numericUserId);
        setUserPosts(postsData);

        // TODO: Fetch initial follow status if API supports it
        // e.g., const followStatus = await apiClient.getFollowStatus(numericUserId);
        // setIsFollowing(followStatus.isFollowing);
      } catch (err: any) {
        setError(err.message || 'Failed to load user profile.');
        setProfile(null);
        setUserPosts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfileData();
  }, [userId, currentUser]); // Re-fetch if userId changes or current user changes (for follow button state)

  const handleFollowToggle = async () => {
    if (!token || !profile || !currentUser || currentUser.id === profile.id) return;
    setFollowLoading(true);
    setError(null); // Clear previous errors
    try {
        if (isFollowing) {
            await apiClient.unfollowUser(profile.id);
            setIsFollowing(false);
        } else {
            await apiClient.followUser(profile.id);
            setIsFollowing(true);
        }
    } catch (err: any) {
        setError(err.message || "Failed to update follow status. Please try again.");
    } finally {
        setFollowLoading(false);
    }
  };

  if (isLoading) return <div className="container mx-auto p-4 text-center text-gray-500">Loading profile...</div>;
  if (error && !profile) return <div className="container mx-auto p-4 text-center text-red-500 bg-red-50 border border-red-200 rounded-md">{error}</div>;
  if (!profile) return <div className="container mx-auto p-4 text-center text-gray-600">User profile not found.</div>;

  const isOwnProfile = currentUser?.id === profile.id;

  return (
    <div className="container mx-auto p-4 md:p-6 max-w-4xl">
      <header className="bg-white p-6 rounded-lg shadow-md mb-8 flex flex-col sm:flex-row items-center sm:space-x-6">
        <img 
          src={(profile as any).avatarUrl || `https://ui-avatars.com/api/?name=${profile.username}&size=128&background=random`} 
          alt={profile.username}
          className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-pink-200 object-cover mb-4 sm:mb-0"
        />
        <div className="text-center sm:text-left">
          <h1 className="text-3xl font-bold text-gray-800">{profile.username}</h1>
          <p className="text-gray-600 mt-1">{profile.email}</p> {/* Consider privacy for email */}
          <div className="mt-3 text-sm text-gray-500">
            <span><strong className="text-gray-700">{userPosts.length}</strong> posts</span>
            {/* TODO: Add follower/following counts when API supports */}
            {/* <span className="ml-4"><strong className="text-gray-700">X</strong> followers</span> */}
            {/* <span className="ml-4"><strong className="text-gray-700">Y</strong> following</span> */}
          </div>
          
          {!isOwnProfile && token && (
            <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`mt-4 px-5 py-2 rounded-md text-white font-semibold text-sm transition duration-150 ${
                isFollowing 
                ? 'bg-gray-500 hover:bg-gray-600' 
                : 'bg-pink-500 hover:bg-pink-600'
              } disabled:bg-gray-300`}
            >
              {followLoading ? 'Processing...' : (isFollowing ? 'Unfollow' : 'Follow')}
            </button>
          )}
          {isOwnProfile && (
            <RouterLink to="/settings/profile" className="mt-4 inline-block text-sm text-pink-600 hover:text-pink-700 font-medium py-2 px-4 border border-pink-500 rounded-md hover:bg-pink-50 transition duration-150">
              Edit Profile
            </RouterLink>
          )}
          {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
        </div>
      </header>

      <h2 className="text-xl font-semibold text-gray-700 mb-4 border-b pb-2">Posts</h2>
      {userPosts.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-3 gap-1 sm:gap-2 md:gap-4">
          {userPosts.map(post => (
            <RouterLink key={post.id} to={`/post/${post.id}`} className="block group relative aspect-square overflow-hidden rounded-md border border-gray-200 hover:shadow-lg transition-shadow">
                <img 
                    src={post.imageUrl} 
                    alt={post.caption || 'User post'} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                {/* <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-opacity duration-300 flex items-center justify-center">
                    <p className="text-white text-xs opacity-0 group-hover:opacity-100 p-2 truncate">{post.caption}</p>
                </div> */}
            </RouterLink>
          ))}
        </div>
      ) : (
        <p className="text-center text-gray-500 py-10">This user hasn't posted anything yet.</p>
      )}
    </div>
  );
};

export default UserProfilePage;