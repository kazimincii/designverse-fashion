import { useState, useRef, useEffect } from 'react';
import { Bell, Check, X, Wifi, WifiOff } from 'lucide-react';
import { useWebSocket } from '../contexts/WebSocketContext';

export default function NotificationIndicator() {
  const { connected, notifications, markNotificationRead, clearAllNotifications } = useWebSocket();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadCount = notifications.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-800 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-96 bg-gray-900 rounded-lg shadow-xl border border-gray-800 z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-800">
            <div className="flex items-center space-x-2">
              <h3 className="font-semibold">Notifications</h3>
              {connected ? (
                <div className="flex items-center space-x-1 text-xs text-green-500">
                  <Wifi className="w-3 h-3" />
                  <span>Live</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <WifiOff className="w-3 h-3" />
                  <span>Offline</span>
                </div>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-xs text-gray-400 hover:text-white flex items-center space-x-1"
              >
                <Check className="w-3 h-3" />
                <span>Clear all</span>
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No notifications</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-800">
                {notifications.map((notification, index) => (
                  <div
                    key={index}
                    className={`p-4 hover:bg-gray-800/50 transition-colors ${
                      notification.priority === 'high' ? 'bg-red-500/5' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm">{notification.title}</span>
                          {notification.priority === 'high' && (
                            <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400">{notification.message}</p>
                        <div className="text-xs text-gray-600 mt-2">
                          {new Date(notification.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <button
                        onClick={() => markNotificationRead(index)}
                        className="p-1 text-gray-500 hover:text-white rounded transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Additional data */}
                    {notification.data && notification.data.consistencyScore !== undefined && (
                      <div className="mt-2 pt-2 border-t border-gray-800">
                        <div className="text-xs text-gray-400">
                          Quality Score:{' '}
                          <span
                            className={`font-semibold ${
                              notification.data.consistencyScore >= 80
                                ? 'text-green-500'
                                : notification.data.consistencyScore >= 70
                                ? 'text-yellow-500'
                                : 'text-red-500'
                            }`}
                          >
                            {notification.data.consistencyScore.toFixed(1)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
