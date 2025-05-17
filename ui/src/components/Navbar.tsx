// src/components/Navbar.tsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/search?query=${encodeURIComponent(searchTerm.trim())}`);
      setSearchTerm('');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/auth');
  }

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm p-4 sticky top-0 z-50">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-xl font-bold text-pink-600 hover:text-pink-700">
          Leapcell Insta
        </Link>
        
        <form onSubmit={handleSearch} className="flex-grow max-w-xs mx-4">
          <input
            type="text"
            placeholder="Search posts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="p-2 border border-gray-300 rounded-md w-full text-gray-900 bg-white focus:ring-pink-500 focus:border-pink-500 text-sm"
          />
        </form>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <Link 
                to={`/profile/${user.id}`} 
                className="text-gray-700 hover:text-pink-600 text-sm font-medium"
              >
                {user.username}
              </Link>
              <button 
                onClick={handleLogout} 
                className="bg-red-500 text-white px-3 py-1.5 rounded-md hover:bg-red-600 text-sm"
              >
                Logout
              </button>
            </>
          ) : (
            <Link 
              to="/auth" 
              className="bg-pink-500 text-white px-3 py-1.5 rounded-md hover:bg-pink-600 text-sm"
            >
              Login / Register
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;