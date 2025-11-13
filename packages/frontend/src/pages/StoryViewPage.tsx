import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Heart, MessageCircle, Share2, Eye } from 'lucide-react';
import { storyApi, socialApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import { Story, Comment } from '../types';

export default function StoryViewPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [comment, setComment] = useState('');

  const { data: storyData, isLoading } = useQuery({
    queryKey: ['story', id],
    queryFn: async () => {
      const response = await storyApi.getById(id!);
      return response.data.data.story as Story;
    },
    enabled: !!id,
  });

  const { data: commentsData } = useQuery({
    queryKey: ['comments', id],
    queryFn: async () => {
      const response = await socialApi.getComments(id!);
      return response.data.data.comments as Comment[];
    },
    enabled: !!id,
  });

  const likeMutation = useMutation({
    mutationFn: () => socialApi.toggleLike(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['story', id] });
    },
  });

  const commentMutation = useMutation({
    mutationFn: (content: string) =>
      socialApi.createComment(id!, { content }),
    onSuccess: () => {
      setComment('');
      queryClient.invalidateQueries({ queryKey: ['comments', id] });
      toast.success('Comment posted');
    },
  });

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Link copied to clipboard!');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!storyData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Story not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <Link
            to="/feed"
            className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent"
          >
            Nim
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-3 gap-8">
          {/* Video Player */}
          <div className="col-span-2">
            <div className="bg-gray-900 rounded-lg overflow-hidden mb-6">
              <div className="aspect-video bg-gray-800 flex items-center justify-center">
                {storyData.clips && storyData.clips[0] ? (
                  <video
                    src={storyData.clips[0].videoUrl}
                    controls
                    className="w-full h-full"
                    poster={storyData.clips[0].thumbnailUrl}
                  />
                ) : (
                  <div className="text-gray-600">No video available</div>
                )}
              </div>
            </div>

            {/* Story Info */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-3">{storyData.title}</h1>
              {storyData.description && (
                <p className="text-gray-400 mb-4">{storyData.description}</p>
              )}

              {/* Creator Info */}
              <div className="flex items-center justify-between mb-6">
                <Link
                  to={`/profile/${storyData.owner?.handle}`}
                  className="flex items-center space-x-3 hover:opacity-80"
                >
                  {storyData.owner?.avatarUrl ? (
                    <img
                      src={storyData.owner.avatarUrl}
                      alt={storyData.owner.displayName}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                  )}
                  <div>
                    <div className="font-semibold">
                      {storyData.owner?.displayName}
                    </div>
                    <div className="text-sm text-gray-400">
                      @{storyData.owner?.handle}
                    </div>
                  </div>
                </Link>

                {/* Actions */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => user && likeMutation.mutate()}
                    disabled={!user}
                    className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
                  >
                    <Heart className="w-5 h-5" />
                    <span>{storyData._count?.likes || 0}</span>
                  </button>
                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded-lg"
                  >
                    <Share2 className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-400">
                <span className="flex items-center space-x-1">
                  <Eye className="w-4 h-4" />
                  <span>{storyData.viewCount} views</span>
                </span>
                <span className="flex items-center space-x-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{storyData._count?.comments || 0} comments</span>
                </span>
              </div>
            </div>
          </div>

          {/* Comments Section */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Comments</h3>

            {/* Add Comment */}
            {user && (
              <div className="mb-6">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
                  placeholder="Add a comment..."
                />
                <button
                  onClick={() => comment.trim() && commentMutation.mutate(comment)}
                  disabled={!comment.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg disabled:opacity-50"
                >
                  Post Comment
                </button>
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-4">
              {commentsData && commentsData.length > 0 ? (
                commentsData.map((comment) => (
                  <div key={comment.id} className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-start space-x-3">
                      {comment.author.avatarUrl ? (
                        <img
                          src={comment.author.avatarUrl}
                          alt={comment.author.displayName}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-sm">
                          {comment.author.displayName}
                        </div>
                        <div className="text-sm text-gray-400 mb-2">
                          @{comment.author.handle}
                        </div>
                        <p className="text-sm">{comment.content}</p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center py-8">
                  No comments yet
                </p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
