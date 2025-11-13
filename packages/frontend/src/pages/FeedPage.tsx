import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, Heart, MessageCircle, Clock } from 'lucide-react';
import { storyApi } from '../services/api';
import { Story } from '../types';
import { useAuth } from '../contexts/AuthContext';

export default function FeedPage() {
  const { user } = useAuth();
  const [feedType, setFeedType] = useState<'global' | 'following'>('global');

  const { data: feedData, isLoading } = useQuery({
    queryKey: ['feed', feedType],
    queryFn: async () => {
      const response = await storyApi.getFeed({ type: feedType, limit: 20 });
      return response.data.data.stories as Story[];
    },
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              to="/"
              className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
            >
              Nim
            </Link>
            <nav className="flex items-center space-x-6">
              {user ? (
                <>
                  <Link to="/workspace" className="text-gray-300 hover:text-white">
                    Workspace
                  </Link>
                  <Link to={`/profile/${user.handle}`} className="text-gray-300 hover:text-white">
                    Profile
                  </Link>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-300 hover:text-white">
                    Sign in
                  </Link>
                  <Link
                    to="/register"
                    className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Feed Type Selector */}
        <div className="flex space-x-4 mb-8">
          <button
            onClick={() => setFeedType('global')}
            className={`px-6 py-3 rounded-lg font-medium ${
              feedType === 'global'
                ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            For You
          </button>
          {user && (
            <button
              onClick={() => setFeedType('following')}
              className={`px-6 py-3 rounded-lg font-medium ${
                feedType === 'following'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : 'bg-gray-800 text-gray-400 hover:text-white'
              }`}
            >
              Following
            </button>
          )}
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : feedData && feedData.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {feedData.map((story) => (
              <Link
                key={story.id}
                to={`/story/${story.id}`}
                className="bg-gray-900 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all"
              >
                <div className="aspect-video bg-gray-800 flex items-center justify-center">
                  {story.clips && story.clips[0]?.thumbnailUrl ? (
                    <img
                      src={story.clips[0].thumbnailUrl}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-gray-600">No preview</div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {story.title}
                  </h3>
                  {story.description && (
                    <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                      {story.description}
                    </p>
                  )}
                  <div className="flex items-center space-x-3 mb-3">
                    <Link
                      to={`/profile/${story.owner?.handle}`}
                      className="flex items-center space-x-2 hover:opacity-80"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {story.owner?.avatarUrl ? (
                        <img
                          src={story.owner.avatarUrl}
                          alt={story.owner.displayName}
                          className="w-6 h-6 rounded-full"
                        />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                      )}
                      <span className="text-sm text-gray-400">
                        @{story.owner?.handle}
                      </span>
                    </Link>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <span className="flex items-center space-x-1">
                        <Eye className="w-4 h-4" />
                        <span>{story.viewCount}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Heart className="w-4 h-4" />
                        <span>{story._count?.likes || 0}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <MessageCircle className="w-4 h-4" />
                        <span>{story._count?.comments || 0}</span>
                      </span>
                    </div>
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {story.totalDurationSeconds
                          ? `${Math.round(story.totalDurationSeconds)}s`
                          : '0s'}
                      </span>
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-400">No stories yet</p>
          </div>
        )}
      </main>
    </div>
  );
}
