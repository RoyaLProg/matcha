import React, { useState, useEffect, useContext, useMemo } from 'react';
import { Bell, Heart, Eye, MessageCircle, UserMinus } from 'lucide-react';
import IHistory from '@/interface/history.interface';
import { WebSocketContext } from '@/contexts/WebSocketContext';

type UIType = 'like' | 'view' | 'message' | 'match' | 'unlike' | 'other';

interface UINotification {
  id: number;
  type: UIType;
  message: string;
  timestamp: Date;
  user: {
    name: string;
    avatar?: string;
  };
  read: boolean;
}

const NotificationBell = () => {
  const socket = useContext(WebSocketContext);
  const [history, setHistory] = useState<IHistory[]>([]);
  const [usernames, setUsernames] = useState<Record<number, string>>({});
  const [showDropdown, setShowDropdown] = useState(false);

  const unreadCount = useMemo(() => history.filter(h => !h.isReaded).length, [history]);

  function typeFromMessage(msg: string): UIType {
    const m = msg.toLowerCase();
    if (m.includes('match')) return 'match';
    if (m.includes('liked')) return 'like';
    if (m.includes('visited') || m.includes('viewed')) return 'view';
    if (m.includes('unlike')) return 'unlike';
    if (m.includes('message')) return 'message';
    return 'other';
  }

  function replacedMessage(h: IHistory, name: string) {
    return h.message.replace('%user%', `@${name}`);
  }

  const uiNotifications: UINotification[] = useMemo(() => {
    return history
      .slice()
      .sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())
      .map(h => ({
        id: h.id!,
        type: typeFromMessage(h.message),
        message: replacedMessage(h, usernames[h.fromId] || 'user'),
        timestamp: new Date(h.createdAt ?? ''),
        user: { name: usernames[h.fromId] || 'user' },
        read: !!h.isReaded,
      }));
  }, [history, usernames]);

  async function fetchHistory() {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/history`, { credentials: 'include' });
      if (!res.ok) return;
      const data: IHistory[] = await res.json();
      setHistory(Array.isArray(data) ? data : []);

      const unique = Array.from(new Set((data || []).map(h => h.fromId)));
      const entries = await Promise.all(
        unique.map(async (id) => {
          try {
            const r = await fetch(`${import.meta.env.VITE_API_URL}/api/Users/${id}/username`, { credentials: 'include' });
            if (!r.ok) return [id, 'user'] as const;
            const name = await r.text();
            return [id, name] as const;
          } catch {
            return [id, 'user'] as const;
          }
        })
      );
      const map: Record<number, string> = {};
      for (const [id, name] of entries) map[id] = name;
      setUsernames(map);
    } catch (e) {
      console.error('Failed to fetch history:', e);
    }
  }

  useEffect(() => { fetchHistory(); }, []);

  useEffect(() => {
    if (!socket) return;
    const onCount = (_count: number) => {
      fetchHistory();
    };
    socket.on('notificationCount', onCount);
    return () => { socket.off('notificationCount', onCount); };
  }, [socket]);

  const getNotificationIcon = (type: UIType) => {
    switch (type) {
      case 'like':
        return <Heart className="w-4 h-4 text-blue-500" />;
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

  const markAsRead = async (id: number) => {
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/history/setAsRead/${id}`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      });
      if (r.ok) setHistory(prev => prev.map(h => h.id === id ? { ...h, isReaded: true } : h));
    } catch {}
  };

  const markAllAsRead = async () => {
    try {
      const r = await fetch(`${import.meta.env.VITE_API_URL}/api/history/setAllAsRead`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
      });
      if (r.ok) setHistory(prev => prev.map(h => ({ ...h, isReaded: true })));
    } catch {}
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-2 text-gray-600 hover:text-blue-500 hover:bg-blue-50 rounded-full transition-all"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
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
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Mark all read
                  </button>
                )}
              </div>
            </div>

            <div className="max-h-96 overflow-y-auto">
              {uiNotifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No notifications yet</p>
                </div>
              ) : (
                uiNotifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !n.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => markAsRead(n.id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                        {n.user.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          {getNotificationIcon(n.type)}
                          <p className="text-sm text-gray-900">
                            <span className="font-medium">{n.user.name}</span>{' '}
                            {n.message.replace(`@${n.user.name}`, `@${n.user.name}`)}
                          </p>
                          {!n.read && (
                            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(n.timestamp)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {uiNotifications.length > 0 && (
              <div className="p-4 border-t border-gray-200">
                <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
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
