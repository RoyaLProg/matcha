import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { Send, MoreVertical, Heart, Phone, Video, Image, ArrowLeft } from 'lucide-react';
import VideoChat from '../components/VideoChat';
import { ChatContext } from '../contexts/ChatContext';
import { UserContext } from '../contexts/UserContext';
import { MessageType } from '../interface/message.interface';
import { WebSocketContext } from '../contexts/WebSocketContext';
import { CallContext } from '../contexts/CallContext';

const ChatPage = () => {
  const { id } = useParams();
  const chatsCtx = useContext(ChatContext);
  const userCtx = useContext(UserContext);
  const [message, setMessage] = useState('');
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [blocked, setBlocked] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socket = useContext(WebSocketContext);
  const callCtx = useContext(CallContext);

  const chat = useMemo(() => {
    const chatId = Number(id);
    return (chatsCtx?.chats ?? []).find(c => c.id === chatId);
  }, [chatsCtx?.chats, id]);

  const otherUser = useMemo(() => {
    if (!chat || !userCtx?.user) return undefined;
    return chat.user?.id === userCtx.user.id ? chat.targetUser : chat.user;
  }, [chat, userCtx?.user]);

  useEffect(() => {
  }, [chat?.id]);

  useEffect(() => {
    if (!socket || !id) return;
    const room = `chat_${id}`;
    socket.emit('JoinRoom', room);
    return () => {
      socket.emit('LeaveRoom', room);
    };
  }, [socket, id]);

  useEffect(() => {
    (async () => {
      try {
        if (!otherUser?.id) return;
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/Users/${otherUser.id}`, { credentials: 'include' });
        if (!res.ok) return;
        const data = await res.json();
        if (typeof data?.blocked === 'boolean') setBlocked(!!data.blocked);
      } catch {}
    })();
  }, [otherUser?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [chat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const toSecuredMediaUrl = (path: string | null | undefined) => {
    if (!path) return '';
    const p = path.startsWith('/api/') ? path : (path.startsWith('/upload/') ? '/api' + path : path);
    return `${import.meta.env.VITE_API_URL}${p}`;
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !chat || !userCtx?.user || !chatsCtx?.sendMessage) return;

    const newMessage = {
      chatId: chat.id!,
      userId: userCtx.user.id,
      type: MessageType.Text,
      content: message,
      fileUrl: null,
      createdAt: new Date(),
    };
    chatsCtx.sendMessage(newMessage as any);
    setMessage('');
  };

  const normalize = (url?: string) => {
    if (!url) return undefined as any;
    if (/^https?:/i.test(url)) return url;
    if (url.startsWith('/api/')) return `${import.meta.env.VITE_API_URL}${url}`;
    return `${import.meta.env.VITE_API_URL}/api${url}`;
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!chat || !otherUser) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Chat not found</h2>
            <p className="text-gray-600 mb-6">This conversation doesn't exist or you don't have access to it.</p>
            <Link
              to="/chat"
              className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-sky-500 text-white rounded-lg hover:from-blue-600 hover:to-sky-600 transition-all"
            >
              Back to Messages
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden h-[600px] flex flex-col">
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Link
                  to="/chat"
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors md:hidden"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Link>
                <div className="relative">
                  <img
                    src={otherUser?.settings?.pictures?.length ? normalize(otherUser.settings.pictures.find((p:any)=>p.isProfile)?.url) : 'https://www.w3schools.com/w3images/avatar2.png'}
                    alt={otherUser?.username ?? 'User'}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  {(otherUser as any)?.status === 'online' && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 border-2 border-white rounded-full"></div>
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{otherUser?.firstName ?? otherUser?.username}</h2>
                  <p className="text-sm text-gray-500">
                    {(otherUser as any)?.status === 'online' ? 'Active now' : 'Last seen recently'}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => {
                  if (chat && otherUser && callCtx) callCtx.startCall({ type: 'audio', chatId: chat.id!, toUserId: otherUser.id });
                }}>
                  <Phone className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" onClick={() => {
                  if (chat && otherUser && callCtx) callCtx.startCall({ type: 'video', chatId: chat.id!, toUserId: otherUser.id });
                }}>
                  <Video className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
            {(chat.messages ?? []).map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${msg.userId === userCtx?.user?.id ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl ${
                    msg.userId === userCtx?.user?.id
                      ? 'bg-gradient-to-r from-blue-500 to-sky-500 text-white'
                      : 'bg-gray-100 text-gray-900'
                  }`}
                >
                  {msg.type === MessageType.Text && <p className="text-sm">{msg.content}</p>}
                  {msg.type === MessageType.Audio && msg.fileUrl && (
                    <audio controls>
                      <source src={toSecuredMediaUrl(msg.fileUrl)} type="audio/webm" />
                    </audio>
                  )}
                  {msg.type === MessageType.Video && msg.fileUrl && (
                    <video controls width="200">
                      <source src={toSecuredMediaUrl(msg.fileUrl)} type="video/webm" />
                    </video>
                  )}
                  <p
                    className={`text-xs mt-1 ${
                      msg.userId === userCtx?.user?.id ? 'text-blue-100' : 'text-gray-500'
                    }`}
                  >
                    {msg.createdAt ? formatTime(new Date(msg.createdAt)) : ''}
                  </p>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <div className="border-t border-gray-200 px-6 py-4">
            {blocked && (
              <div className="mb-2 text-sm text-red-500">Messaging disabled: you have blocked this user or they blocked you.</div>
            )}
            <form onSubmit={handleSendMessage} className="flex items-center space-x-2">
              <button
                type="button"
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Image className="w-5 h-5" />
              </button>
              
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type a message..."
                  disabled={blocked}
                  className="w-full px-4 py-3 border border-gray-300 rounded-full focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-400"
                />
              </div>

              <button
                type="submit"
                disabled={!message.trim()}
                className="p-3 bg-gradient-to-r from-blue-500 to-sky-500 hover:from-blue-600 hover:to-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-full transition-all"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 rounded-2xl p-6">
          <div className="flex items-center justify-center space-x-2 text-blue-600">
            <Heart className="w-5 h-5 fill-current" />
            <span className="font-medium">
              You and {otherUser?.firstName ?? otherUser?.username} liked each other! Start the conversation.
            </span>
          </div>
        </div>

        <VideoChat
          isOpen={showVideoChat}
          onClose={() => setShowVideoChat(false)}
          recipientName={otherUser?.firstName ?? otherUser?.username ?? 'User'}
          recipientAvatar={otherUser?.settings?.pictures?.length ? `${import.meta.env.VITE_API_URL}/api${otherUser.settings.pictures.find((p:any)=>p.isProfile)?.url}` : undefined}
          chatId={chat.id}
        />
      </div>
    </Layout>
  );
};

export default ChatPage;
