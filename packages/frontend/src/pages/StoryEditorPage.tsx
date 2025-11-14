import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Save, Upload, Play, Plus, Trash2, X, Tag } from 'lucide-react';
import { storyApi, clipApi } from '../services/api';
import toast from 'react-hot-toast';
import { Story, Clip } from '../types';
import AIGenerationPanel from '../components/AIGenerationPanel';

export default function StoryEditorPage() {
  const { storyId } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [privacy, setPrivacy] = useState<'PRIVATE' | 'UNLISTED' | 'PUBLIC'>('UNLISTED');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { data: storyData, isLoading } = useQuery({
    queryKey: ['story', storyId],
    queryFn: async () => {
      if (!storyId) return null;
      const response = await storyApi.getById(storyId);
      return response.data.data.story as Story;
    },
    enabled: !!storyId,
  });

  useEffect(() => {
    if (storyData) {
      setTitle(storyData.title);
      setDescription(storyData.description || '');
      setPrivacy(storyData.privacy);
      setCategory((storyData as any).category || '');
      setTags((storyData as any).tags || []);
    }
  }, [storyData]);

  const updateStoryMutation = useMutation({
    mutationFn: async (data: any) => {
      return await storyApi.update(storyId!, data);
    },
    onSuccess: () => {
      toast.success('Story saved');
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
    },
    onError: () => {
      toast.error('Failed to save story');
    },
  });

  const publishMutation = useMutation({
    mutationFn: async () => {
      return await storyApi.update(storyId!, { status: 'PUBLISHED' });
    },
    onSuccess: () => {
      toast.success('Story published!');
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
    },
  });

  const deleteClipMutation = useMutation({
    mutationFn: async (clipId: string) => {
      return await clipApi.delete(clipId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', storyId] });
    },
  });

  const handleSave = () => {
    updateStoryMutation.mutate({
      title,
      description,
      privacy,
      category: category || null,
      tags: tags.length > 0 ? tags : [],
    });
  };

  const handleAddTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim().toLowerCase();
      if (!tags.includes(newTag)) {
        setTags([...tags, newTag]);
      }
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handlePublish = () => {
    if (!storyData?.clips || storyData.clips.length === 0) {
      toast.error('Add at least one clip before publishing');
      return;
    }
    publishMutation.mutate();
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/workspace')}
                className="p-2 hover:bg-gray-800 rounded-lg"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-xl font-semibold bg-transparent border-none focus:outline-none"
                placeholder="Story title"
              />
            </div>
            <div className="flex items-center space-x-3">
              <select
                value={privacy}
                onChange={(e) => setPrivacy(e.target.value as any)}
                className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm"
              >
                <option value="PRIVATE">Private</option>
                <option value="UNLISTED">Unlisted</option>
                <option value="PUBLIC">Public</option>
              </select>
              <button
                onClick={handleSave}
                className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
              >
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
              <button
                onClick={handlePublish}
                disabled={storyData?.status === 'PUBLISHED'}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-4 py-2 rounded-lg disabled:opacity-50"
              >
                <Play className="w-4 h-4" />
                <span>
                  {storyData?.status === 'PUBLISHED' ? 'Published' : 'Publish'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Editor */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Left Panel - Clips */}
          <div className="col-span-2">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-4">Clips</h3>
              <div className="space-y-3">
                {storyData?.clips && storyData.clips.length > 0 ? (
                  storyData.clips.map((clip: Clip) => (
                    <div
                      key={clip.id}
                      className="bg-gray-800 rounded-lg p-4 flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-32 h-20 bg-gray-700 rounded overflow-hidden">
                          {clip.thumbnailUrl && (
                            <img
                              src={clip.thumbnailUrl}
                              alt="Clip"
                              className="w-full h-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium">Clip {clip.orderIndex + 1}</p>
                          <p className="text-xs text-gray-400">
                            {clip.durationSeconds.toFixed(1)}s
                          </p>
                          {clip.inputPrompt && (
                            <p className="text-xs text-gray-500 mt-1 max-w-md truncate">
                              {clip.inputPrompt}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteClipMutation.mutate(clip.id)}
                        className="p-2 hover:bg-gray-700 rounded-lg text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-12 bg-gray-800 rounded-lg">
                    <Upload className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-400 mb-4">No clips yet</p>
                    <p className="text-sm text-gray-500">
                      Upload video files or generate clips with AI
                    </p>
                  </div>
                )}
              </div>
              <button className="mt-4 w-full flex items-center justify-center space-x-2 bg-gray-800 hover:bg-gray-700 py-3 rounded-lg">
                <Plus className="w-5 h-5" />
                <span>Add Clip</span>
              </button>
            </div>
          </div>

          {/* Right Panel - AI Generation & Properties */}
          <div className="space-y-6">
            {/* AI Generation Panel */}
            <AIGenerationPanel
              storyId={storyId}
              onVideoGenerated={() => {
                queryClient.invalidateQueries({ queryKey: ['story', storyId] });
              }}
            />

            {/* Story Details */}
            <div className="bg-gray-800 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4">Story Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Description
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={4}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe your story..."
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Category
                  </label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., fashion, lifestyle, editorial"
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Type a tag and press Enter"
                  />
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className="inline-flex items-center space-x-1 bg-purple-600/20 border border-purple-500/30 rounded-full px-3 py-1 text-xs"
                        >
                          <Tag className="w-3 h-3" />
                          <span>{tag}</span>
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:bg-purple-500/30 rounded-full p-0.5"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">
                    Stats
                  </label>
                  <div className="bg-gray-900 rounded-lg p-3 space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Duration</span>
                      <span>
                        {storyData?.totalDurationSeconds
                          ? `${storyData.totalDurationSeconds.toFixed(1)}s`
                          : '0s'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Clips</span>
                      <span>{storyData?.clips?.length || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status</span>
                      <span
                        className={
                          storyData?.status === 'PUBLISHED'
                            ? 'text-green-400'
                            : 'text-yellow-400'
                        }
                      >
                        {storyData?.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
