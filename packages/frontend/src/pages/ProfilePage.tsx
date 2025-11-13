import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings, Users, Video as VideoIcon } from 'lucide-react';
import { socialApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { User, Story } from '../types';

export default function ProfilePage() {
  const { handle } = useParams();
  const { user: currentUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['profile', handle],
    queryFn: async () => {
      const response = await socialApi.getUserProfile(handle!);
      return response.data.data as { user: User & { isFollowing: boolean; _count: any }; stories: Story[] };
    },
    enabled: !!handle,
  });

  const followMutation = useMutation({
    mutationFn: () => socialApi.toggleFollow(profileData!.user.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile', handle] });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-white">User not found</div>
      </div>
    );
  }

  const { user, stories } = profileData;
  const isOwnProfile = currentUser?.id === user.id;

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

      {/* Profile Header */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <div className="flex items-start space-x-8">
            {user.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.displayName}
                className="w-32 h-32 rounded-full"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-500" />
            )}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-1">{user.displayName}</h1>
                  <p className="text-gray-400">@{user.handle}</p>
                </div>
                {isOwnProfile ? (
                  <Link
                    to="/workspace"
                    className="flex items-center space-x-2 bg-gray-800 hover:bg-gray-700 px-6 py-2 rounded-lg"
                  >
                    <Settings className="w-5 h-5" />
                    <span>Edit Profile</span>
                  </Link>
                ) : currentUser ? (
                  <button
                    onClick={() => followMutation.mutate()}
                    className={`px-6 py-2 rounded-lg font-medium ${
                      user.isFollowing
                        ? 'bg-gray-800 hover:bg-gray-700'
                        : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                    }`}
                  >
                    {user.isFollowing ? 'Following' : 'Follow'}
                  </button>
                ) : null}
              </div>

              {user.bio && <p className="text-gray-300 mb-4">{user.bio}</p>}

              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <VideoIcon className="w-4 h-4 text-gray-400" />
                  <span>
                    <span className="font-semibold">{user._count?.stories || 0}</span>{' '}
                    <span className="text-gray-400">stories</span>
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-gray-400" />
                  <span>
                    <span className="font-semibold">{user._count?.followers || 0}</span>{' '}
                    <span className="text-gray-400">followers</span>
                  </span>
                </div>
                <div>
                  <span className="font-semibold">{user._count?.following || 0}</span>{' '}
                  <span className="text-gray-400">following</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stories Grid */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Stories</h2>
        {stories && stories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {stories.map((story) => (
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
                  <h3 className="text-lg font-semibold mb-2">{story.title}</h3>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{story.viewCount} views</span>
                    <span>{story._count?.likes || 0} likes</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 text-gray-400">
            No stories published yet
          </div>
        )}
      </main>
    </div>
  );
}
