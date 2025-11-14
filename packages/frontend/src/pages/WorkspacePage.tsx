import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Video, Clock, Eye, Heart, Camera, BarChart3, Settings, FileText, Trash2, Lock, Globe, CheckSquare, Square } from 'lucide-react';
import { storyApi, bulkApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Story } from '../types';
import NotificationIndicator from '../components/NotificationIndicator';
import SearchBar from '../components/SearchBar';

export default function WorkspacePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'draft' | 'published'>('all');
  const [selectedStories, setSelectedStories] = useState<string[]>([]);
  const [bulkMode, setBulkMode] = useState(false);

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

  // Bulk delete mutation
  const bulkDeleteMutation = useMutation({
    mutationFn: (storyIds: string[]) => bulkApi.deleteStories(storyIds),
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      setSelectedStories([]);
      setBulkMode(false);
    },
    onError: () => {
      toast.error('Failed to delete stories');
    },
  });

  // Bulk privacy update mutation
  const bulkPrivacyMutation = useMutation({
    mutationFn: ({ storyIds, privacy }: { storyIds: string[]; privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE' }) =>
      bulkApi.updateStoryPrivacy(storyIds, privacy),
    onSuccess: (data) => {
      toast.success(data.data.message);
      queryClient.invalidateQueries({ queryKey: ['my-stories'] });
      setSelectedStories([]);
      setBulkMode(false);
    },
    onError: () => {
      toast.error('Failed to update privacy settings');
    },
  });

  // Handlers
  const handleToggleStory = (storyId: string) => {
    setSelectedStories((prev) =>
      prev.includes(storyId)
        ? prev.filter((id) => id !== storyId)
        : [...prev, storyId]
    );
  };

  const handleSelectAll = () => {
    if (filteredStories && selectedStories.length === filteredStories.length) {
      setSelectedStories([]);
    } else {
      setSelectedStories(filteredStories?.map((s) => s.id) || []);
    }
  };

  const handleBulkDelete = () => {
    if (selectedStories.length === 0) return;
    if (window.confirm(`Delete ${selectedStories.length} selected stories?`)) {
      bulkDeleteMutation.mutate(selectedStories);
    }
  };

  const handleBulkPrivacy = (privacy: 'PUBLIC' | 'UNLISTED' | 'PRIVATE') => {
    if (selectedStories.length === 0) return;
    bulkPrivacyMutation.mutate({ storyIds: selectedStories, privacy });
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
          <div className="flex justify-between items-center h-16 space-x-6">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent whitespace-nowrap">
              Nim
            </h1>

            <div className="flex-1 max-w-xl">
              <SearchBar />
            </div>

            <nav className="flex items-center space-x-6">
              <Link to="/feed" className="text-gray-300 hover:text-white whitespace-nowrap">
                Feed
              </Link>
              <Link to={`/profile/${user?.handle}`} className="text-gray-300 hover:text-white whitespace-nowrap">
                Profile
              </Link>
              <div className="flex items-center space-x-3">
                <NotificationIndicator />
                <Link
                  to="/settings"
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
                  title="Settings"
                >
                  <Settings className="w-5 h-5" />
                </Link>
                <span className="text-sm text-gray-400 whitespace-nowrap">
                  {user?.creditsBalance} credits
                </span>
                <button
                  onClick={logout}
                  className="text-sm text-gray-400 hover:text-white whitespace-nowrap"
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
          <div className="flex items-center space-x-4">
            {filteredStories && filteredStories.length > 0 && (
              <button
                onClick={() => {
                  setBulkMode(!bulkMode);
                  setSelectedStories([]);
                }}
                className={`flex items-center space-x-2 px-4 py-3 rounded-lg transition-all ${
                  bulkMode
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
              >
                {bulkMode ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5" />}
                <span>Bulk Select</span>
              </button>
            )}
            <Link
              to="/templates"
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-all"
            >
              <FileText className="w-5 h-5" />
              <span>Templates</span>
            </Link>
            <Link
              to="/analytics"
              className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 text-white px-4 py-3 rounded-lg transition-all"
            >
              <BarChart3 className="w-5 h-5" />
              <span>Analytics</span>
            </Link>
            <Link
              to="/premium-photo"
              className="flex items-center space-x-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all relative"
            >
              <Camera className="w-5 h-5" />
              <span>Premium Photo</span>
              <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                BETA
              </span>
            </Link>
            <button
              onClick={handleCreateStory}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              <Plus className="w-5 h-5" />
              <span>New Story</span>
            </button>
          </div>
        </div>

        {/* Bulk Actions Toolbar */}
        {bulkMode && selectedStories.length > 0 && (
          <div className="mb-6 p-4 bg-blue-900/30 border border-blue-700 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">
                {selectedStories.length} story(ies) selected
              </span>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleBulkPrivacy('PUBLIC')}
                  disabled={bulkPrivacyMutation.isPending}
                  className="flex items-center space-x-1 px-3 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  <Globe className="w-4 h-4" />
                  <span>Make Public</span>
                </button>
                <button
                  onClick={() => handleBulkPrivacy('UNLISTED')}
                  disabled={bulkPrivacyMutation.isPending}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>Make Unlisted</span>
                </button>
                <button
                  onClick={() => handleBulkPrivacy('PRIVATE')}
                  disabled={bulkPrivacyMutation.isPending}
                  className="flex items-center space-x-1 px-3 py-2 bg-gray-700 hover:bg-gray-800 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  <Lock className="w-4 h-4" />
                  <span>Make Private</span>
                </button>
                <button
                  onClick={handleBulkDelete}
                  disabled={bulkDeleteMutation.isPending}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex space-x-4">
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
          {bulkMode && filteredStories && filteredStories.length > 0 && (
            <button
              onClick={handleSelectAll}
              className="flex items-center space-x-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm"
            >
              {selectedStories.length === filteredStories.length ? (
                <CheckSquare className="w-4 h-4 text-blue-500" />
              ) : (
                <Square className="w-4 h-4" />
              )}
              <span>Select All ({filteredStories.length})</span>
            </button>
          )}
        </div>

        {/* Stories Grid */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">Loading...</div>
        ) : filteredStories && filteredStories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStories.map((story) => (
              <div
                key={story.id}
                className="bg-gray-800 rounded-lg overflow-hidden hover:ring-2 hover:ring-blue-500 transition-all group relative"
                onClick={(e) => {
                  if (bulkMode) {
                    e.preventDefault();
                    handleToggleStory(story.id);
                  }
                }}
              >
                {bulkMode && (
                  <div
                    className="absolute top-3 left-3 z-10 p-2 bg-gray-900/80 rounded-lg cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleStory(story.id);
                    }}
                  >
                    {selectedStories.includes(story.id) ? (
                      <CheckSquare className="w-5 h-5 text-blue-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                )}
                <Link
                  to={bulkMode ? '#' : `/editor/${story.id}`}
                  onClick={(e) => {
                    if (bulkMode) {
                      e.preventDefault();
                    }
                  }}
                  className="block"
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
              </div>
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
