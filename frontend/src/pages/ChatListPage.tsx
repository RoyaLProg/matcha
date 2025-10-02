
import React, { useContext, useMemo } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { MessageCircle, Clock } from 'lucide-react';
import { ChatContext } from '../contexts/ChatContext';
import { UserContext } from '../contexts/UserContext';

const ChatListPage = () => {
  const chatsCtx = useContext(ChatContext);
  const userCtx = useContext(UserContext);

  const handleRefresh = () => {
    console.log("Manual refresh triggered");
    chatsCtx?.refreshChats();
  };

  const normalize = (url?: string) => {
    if (!url) return undefined;
    if (/^https?:/i.test(url)) return url;
    if (url.startsWith('/api/')) return `${import.meta.env.VITE_API_URL}${url}`;
    return `${import.meta.env.VITE_API_URL}/api${url}`;
  };

  const items = useMemo(() => {
    const list = chatsCtx?.chats ?? [];
    const meId = userCtx?.user?.id;
    return list.map(chat => {
      const other = meId && chat.user?.id === meId ? chat.targetUser : chat.user;
      const last = (chat.messages ?? []).slice().sort((a, b) => new Date(b.createdAt ?? '').getTime() - new Date(a.createdAt ?? '').getTime())[0];
      const avatarUrl = other?.settings?.pictures?.find(p => p.isProfile)?.url;
      const fullAvatar = normalize(avatarUrl);
      return {
        id: chat.id!,
        name: other ? `${other.firstName ?? other.username ?? 'User'}` : 'User',
        avatar: fullAvatar,
        isOnline: (other as any)?.status === 'online',
        lastMessage: last ? { content: last.content ?? (last.fileUrl ? '[media]' : ''), createdAt: new Date(last.createdAt ?? '') } : undefined,
        unreadCount: 0,
      };
    });
  }, [chatsCtx?.chats, userCtx?.user?.id]);

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

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden border border-blue-100">
          <div className="bg-gradient-to-r from-blue-500 to-sky-500 px-6 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-white flex items-center">
                <MessageCircle className="w-6 h-6 mr-2" />
                Messages
                {0 > 0 && (
                  <span className="ml-2 bg-white text-blue-600 text-sm px-2 py-1 rounded-full font-semibold">
                    {0}
                  </span>
                )}
              </h1>
              <button
                onClick={handleRefresh}
                className="px-3 py-1 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>

          {items.length === 0 ? (
            <div className="p-12 text-center">
              <MessageCircle className="w-16 h-16 text-blue-200 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-700 mb-2">No conversations yet</h2>
              <p className="text-gray-500 mb-6">Start matching with people to begin chatting!</p>
              <Link
                to="/home"
                className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-xl hover:from-blue-600 hover:to-sky-600 transition-all font-semibold shadow-lg hover:shadow-blue-200"
              >
                Discover People
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-blue-50">
              {items.map((conversation) => (
                <Link
                  key={conversation.id}
                  to={`/chat/${conversation.id}`}
                  className="flex items-center p-6 hover:bg-blue-50 transition-all duration-200 group"
                >
                  <div className="relative">
                    {conversation.avatar ? (
                      <img
                        src={conversation.avatar}
                        alt={conversation.name}
                        className="w-12 h-12 rounded-full object-cover shadow-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center shadow-lg font-semibold">
                        {conversation.name[0]?.toUpperCase() ?? 'U'}
                      </div>
                    )}
                    {conversation.isOnline && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                    )}
                  </div>

                  <div className="ml-4 flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-900 truncate group-hover:text-blue-700 transition-colors">
                        {conversation.name}
                      </h3>
                      {conversation.lastMessage && conversation.lastMessage.createdAt && (
                        <div className="flex items-center text-gray-500 text-sm">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTime(conversation.lastMessage.createdAt)}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center justify-between mt-1">
                      {conversation.lastMessage ? (
                        <p className="text-gray-600 text-sm truncate">
                          {conversation.lastMessage.content || '[media]'}
                        </p>
                      ) : (
                        <p className="text-gray-400 text-sm italic">Start a conversation...</p>
                      )}

                      {conversation.unreadCount > 0 && (
                        <span className="bg-gradient-to-r from-blue-500 to-sky-500 text-white text-xs px-2 py-1 rounded-full font-medium">
                          {conversation.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default ChatListPage;
