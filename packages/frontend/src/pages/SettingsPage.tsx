import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Lock, Bell, Save } from 'lucide-react';
import { authApi, qualityApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

type TabType = 'profile' | 'password' | 'notifications';

export default function SettingsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [loading, setLoading] = useState(false);

  // Profile form
  const [profileForm, setProfileForm] = useState({
    displayName: '',
    handle: '',
    bio: '',
    avatarUrl: '',
  });

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Notification preferences
  const [notificationPrefs, setNotificationPrefs] = useState({
    emailNotifications: true,
    pushNotifications: true,
    generationComplete: true,
    generationFailed: true,
    qualityAlerts: true,
    weeklyDigest: false,
    muteAll: false,
  });

  useEffect(() => {
    if (user) {
      setProfileForm({
        displayName: user.displayName || '',
        handle: user.handle || '',
        bio: user.bio || '',
        avatarUrl: user.avatarUrl || '',
      });
    }
  }, [user]);

  useEffect(() => {
    loadNotificationPreferences();
  }, []);

  const loadNotificationPreferences = async () => {
    try {
      const response = await qualityApi.getNotificationPreferences();
      setNotificationPrefs(response.data.data.preferences);
    } catch (err) {
      console.error('Failed to load notification preferences:', err);
    }
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authApi.updateProfile(profileForm);
      toast.success('Profile updated successfully! Please refresh to see changes.');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      toast.error(err.response?.data?.error || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);

    try {
      await authApi.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Password changed successfully!');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: any) {
      console.error('Failed to change password:', err);
      toast.error(err.response?.data?.error || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await qualityApi.setNotificationPreferences(notificationPrefs);
      toast.success('Notification preferences updated!');
    } catch (err: any) {
      console.error('Failed to update preferences:', err);
      toast.error(err.response?.data?.error || 'Failed to update preferences');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-gray-400 mt-1">Manage your account and preferences</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center space-x-1 mb-6 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex items-center space-x-2 flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'profile'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Profile</span>
          </button>
          <button
            onClick={() => setActiveTab('password')}
            className={`flex items-center space-x-2 flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'password'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Password</span>
          </button>
          <button
            onClick={() => setActiveTab('notifications')}
            className={`flex items-center space-x-2 flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'notifications'
                ? 'bg-purple-600 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>Notifications</span>
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-900 rounded-lg p-6">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Display Name</label>
                <input
                  type="text"
                  value={profileForm.displayName}
                  onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Your display name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Username (Handle)</label>
                <input
                  type="text"
                  value={profileForm.handle}
                  onChange={(e) => setProfileForm({ ...profileForm, handle: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="username"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Only letters, numbers, and underscores. 3-30 characters.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={profileForm.bio}
                  onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Tell us about yourself..."
                  rows={4}
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {profileForm.bio.length}/500 characters
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Avatar URL</label>
                <input
                  type="url"
                  value={profileForm.avatarUrl}
                  onChange={(e) => setProfileForm({ ...profileForm, avatarUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="https://example.com/avatar.jpg"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </form>
          )}

          {/* Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordChange} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Current Password</label>
                <input
                  type="password"
                  value={passwordForm.currentPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">New Password</label>
                <input
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Enter new password"
                  required
                  minLength={6}
                />
                <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Confirm New Password</label>
                <input
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e) =>
                    setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Changing...' : 'Change Password'}</span>
              </button>
            </form>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <form onSubmit={handleNotificationUpdate} className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium">Email Notifications</div>
                    <div className="text-sm text-gray-400">Receive notifications via email</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.emailNotifications}
                      onChange={(e) =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          emailNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <div className="font-medium">Push Notifications</div>
                    <div className="text-sm text-gray-400">
                      Receive real-time push notifications
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.pushNotifications}
                      onChange={(e) =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          pushNotifications: e.target.checked,
                        })
                      }
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-600 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                  <h3 className="font-medium mb-3">Event Notifications</h3>

                  <div className="space-y-3">
                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.generationComplete}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            generationComplete: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-600"
                      />
                      <div>
                        <div className="text-sm font-medium">Generation Complete</div>
                        <div className="text-xs text-gray-400">
                          When a photo generation finishes
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.generationFailed}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            generationFailed: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-600"
                      />
                      <div>
                        <div className="text-sm font-medium">Generation Failed</div>
                        <div className="text-xs text-gray-400">When a generation fails</div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.qualityAlerts}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            qualityAlerts: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-600"
                      />
                      <div>
                        <div className="text-sm font-medium">Quality Alerts</div>
                        <div className="text-xs text-gray-400">
                          Low quality score warnings
                        </div>
                      </div>
                    </label>

                    <label className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={notificationPrefs.weeklyDigest}
                        onChange={(e) =>
                          setNotificationPrefs({
                            ...notificationPrefs,
                            weeklyDigest: e.target.checked,
                          })
                        }
                        className="w-4 h-4 rounded border-gray-600 text-purple-600 focus:ring-purple-600"
                      />
                      <div>
                        <div className="text-sm font-medium">Weekly Digest</div>
                        <div className="text-xs text-gray-400">
                          Weekly summary of your activity
                        </div>
                      </div>
                    </label>
                  </div>
                </div>

                <div className="border-t border-gray-700 pt-4 mt-4">
                  <label className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      checked={notificationPrefs.muteAll}
                      onChange={(e) =>
                        setNotificationPrefs({
                          ...notificationPrefs,
                          muteAll: e.target.checked,
                        })
                      }
                      className="w-4 h-4 rounded border-gray-600 text-red-600 focus:ring-red-600"
                    />
                    <div>
                      <div className="text-sm font-medium text-red-400">Mute All Notifications</div>
                      <div className="text-xs text-gray-400">
                        Temporarily disable all notifications
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center space-x-2 px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{loading ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
