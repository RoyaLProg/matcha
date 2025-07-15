
import React, { useState, useEffect } from 'react';
import { Bell, Heart, Eye, MessageCircle, UserMinus } from 'lucide-react';

interface Notification {
  id: string;
  type: 'like' | 'view' | 'message' | 'match' | 'unlike';
  message: string;
  timestamp: Date;
  user: {
    name: string;
    avatar: string;
  };
  read: boolean;
}

const NotificationBell = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  const mockNotifications: Notification[] = [
    {
      id: '1',
      type: 'like',
      message: 'liked your profile',
      timestamp: new Date(Date.now() - 300000),
      user: { name: 'Emma', avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c1b0' },
      read: false,
    },
    {
      id: '2',
      type: 'message',
      message: 'sent you a message',
      timestamp: new Date(Date.now() - 900000),
      user: { name: 'Alex', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d' },
      read: false,
    },
    {
      id: '3',
      type: 'view',
      message: 'viewed your profile',
      timestamp: new Date(Date.now() - 1800000),
      user: { name: 'Maya', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80' },
      read: true,
    },
    {
      id: '4',
      type: 'match',
      message: 'It\'s a match!',
      timestamp: new Date(Date.now() - 3600000),
      user: { name: 'Sarah', avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9' },
      read: false,
    },
  ];

  useEffect(() => {
    setNotifications(mockNotifications);
    
    // Simulate real-time notifications
    const interval = setInterval(() => {
      const newNotification: Notification = {
        id: Date.now().toString(),
        type: 'like',
        message: 'liked your profile',
        timestamp: new Date(),
        user: { 
          name: 'Someone', 
          avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c1b0' 
        },
        read: false,
      };
      
      setNotifications(prev => [newNotification, ...prev.slice(0, 9)]);
    }, 30000); // Add new notification every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-pink-500" />;
      case 'view':
        return <Eye className="w-4 h-4 text-blue-500" />;
      case 'message':
        return <MessageCircle className="w-4 h-4 text-green-500" />;
      case 'match':
        return <Heart className="w-4 h-4 text-red-500 fill-current" />;
      case 'unlike':
        return <UserMinus className="w-4 h-4 text-gray-500" />;
      default:
        return <Bell className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const markAsRead = (id: string) => {
    setNotifications(prev =>
      prev.map(notification =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-pink-500 hover:bg-pink-50 rounded-full transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowDropdown(false)}
          />
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-lg border border-gray-200 z-20">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-sm text-pink-600 hover:text-pink-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-pink-50' : ''
                    }`}
                    onClick={() => markAsRead(notification.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <img
                        src={notification.user.avatar}
                        alt={notification.user.name}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(notification.type)}
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{notification.user.name}</span>{' '}
                            {notification.message}
                          </p>
                          {!notification.read && (
                            <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(notification.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {notifications.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <button className="w-full text-center text-sm text-pink-600 hover:text-pink-700 font-medium">
                  View all notifications
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
