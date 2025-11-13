import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Video, Clock, Eye, Heart } from 'lucide-react';
import { storyApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Story } from '../types';

export default function WorkspacePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');

  const { data: storiesData, isLoading } = useQuery({
    queryKey: ['my-stories'],
    queryFn: async () => {
      const response = await storyApi.getMyStories();
      return response.data.data.stories as Story[];
    },
  });

  const handleCreateStory = async () => {
    try {
      const response = await storyApi.create({
        title: 'Untitled Story',
        description: '',
        privacy: 'UNLISTED',
      });
      const storyId = response.data.data.story.id;
      navigate(`/editor/${storyId}`);
    } catch (error: any) {
      toast.error('Failed to create story');
    }
  };

  const filteredStories = storiesData?.filter((story) => {
    if (filter === 'draft') return story.status === 'DRAFT';
    if (filter === 'published') return story.status === 'PUBLISHED';
    return true;
  });

  return (
    <div className="min-h-screen bg-black">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Nim
            </h1>
            <nav className="flex items-center space-x-6">
              <Link to="/feed" className="text-gray-300 hover:text-white">
                Feed
              </Link>
              <Link to={`/profile/${user?.handle}`} className="text-gray-300 hover:text-white">
                Profile
              </Link>
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-400">
                  {user?.creditsBalance} credits
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-400 hover:text-white"
                >
                  Logout
                </button>
              </div>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions */}
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">My Stories</h2>
          <button
            onClick={handleCreateStory}
            className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
          >
            <Plus className="w-5 h-5" />
            <span>New Story</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('draft')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'draft'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Drafts
          </button>
          <button
            onClick={() => setFilter('published')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'published'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:text-white'
            }`}
          >
            Published
          </button>
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filteredStories && filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <Link
                key={story.id}
                to={`/editor/${story.id}`}
                className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group"
              >
                <div className="aspect-video bg-gray-700 flex items-center justify-center">
                  {story.clips && story.clips.length > 0 && story.clips[0].thumbnailUrl ? (
                    <img
                      src={story.clips[0].thumbnailUrl}
                      alt={story.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Video className="w-16 h-16 text-gray-600" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 truncate">
                    {story.title}
                  </h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>
                        {story.totalDurationSeconds
                          ? `${Math.round(story.totalDurationSeconds)}s`
                          : '0s'}
                      </span>
                    </span>
                    {story.status === 'PUBLISHED' && (
                      <div className="flex items-center space-x-3">
                        <span className="flex items-center space-x-1">
                          <Eye className="w-4 h-4" />
                          <span>{story.viewCount}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Heart className="w-4 h-4" />
                          <span>{story._count?.likes || 0}</span>
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 mb-4">
              No stories yet. Create your first one!
            </p>
            <button
              onClick={handleCreateStory}
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              Create Story
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
