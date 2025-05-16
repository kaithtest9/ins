// src/pages/SearchResultsPage.tsx
import React from 'react';
import { useLocation } from 'react-router-dom';
import FeedPage from './FeedPage';

const SearchResultsPage: React.FC = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const query = queryParams.get('query') || '';

  // If no query, maybe redirect to home or show a message
  if (!query) {
      return (
          <div className="container mx-auto p-4 text-center">
              <p className="text-xl text-gray-600">Please enter a search term.</p>
          </div>
      );
  }

  return <FeedPage searchQuery={query} />;
};

export default SearchResultsPage;