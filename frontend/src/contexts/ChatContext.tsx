
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  unreadCount: number;
  user: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
}

interface ChatContextType {
  conversations: Conversation[];
  messages: { [conversationId: string]: Message[] };
  sendMessage: (conversationId: string, content: string) => void;
  markAsRead: (conversationId: string) => void;
  getUnreadCount: () => number;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<{ [conversationId: string]: Message[] }>({});

  // Mock conversations
  const mockConversations: Conversation[] = [
    {
      id: '1',
      participants: ['current-user', 'emma'],
      unreadCount: 2,
      user: {
        id: 'emma',
        name: 'Emma',
        avatar: 'https://images.unsplash.com/photo-1494790108755-2616b332c1b0',
        isOnline: true,
      },
    },
    {
      id: '2',
      participants: ['current-user', 'alex'],
      unreadCount: 0,
      user: {
        id: 'alex',
        name: 'Alex',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d',
        isOnline: false,
      },
    },
    {
      id: '3',
      participants: ['current-user', 'maya'],
      unreadCount: 1,
      user: {
        id: 'maya',
        name: 'Maya',
        avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80',
        isOnline: true,
      },
    },
  ];

  // Mock messages
  const mockMessages = {
    '1': [
      {
        id: '1',
        senderId: 'emma',
        receiverId: 'current-user',
        content: 'Hey! Thanks for the like! 😊',
        timestamp: new Date(Date.now() - 3600000),
        read: true,
      },
      {
        id: '2',
        senderId: 'current-user',
        receiverId: 'emma',
        content: 'Hi! I loved your hiking photos, they look amazing!',
        timestamp: new Date(Date.now() - 3500000),
        read: true,
      },
      {
        id: '3',
        senderId: 'emma',
        receiverId: 'current-user',
        content: 'Thank you! I love being outdoors. Do you hike often?',
        timestamp: new Date(Date.now() - 300000),
        read: false,
      },
    ],
    '2': [
      {
        id: '4',
        senderId: 'alex',
        receiverId: 'current-user',
        content: 'Nice to match with you!',
        timestamp: new Date(Date.now() - 7200000),
        read: true,
      },
    ],
    '3': [
      {
        id: '5',
        senderId: 'maya',
        receiverId: 'current-user',
        content: 'Love your music taste! 🎵',
        timestamp: new Date(Date.now() - 1800000),
        read: false,
      },
    ],
  };

  useEffect(() => {
    setConversations(mockConversations);
    setMessages(mockMessages);
  }, []);

  const sendMessage = (conversationId: string, content: string) => {
    const newMessage: Message = {
      id: Date.now().toString(),
      senderId: 'current-user',
      receiverId: conversations.find(c => c.id === conversationId)?.user.id || '',
      content,
      timestamp: new Date(),
      read: true,
    };

    setMessages(prev => ({
      ...prev,
      [conversationId]: [...(prev[conversationId] || []), newMessage],
    }));

    // Update last message in conversation
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, lastMessage: newMessage }
          : conv
      )
    );

    // Simulate response
    setTimeout(() => {
      const responses = [
        "That sounds great!",
        "I'd love to hear more about that!",
        "Really? That's interesting!",
        "Awesome! 😊",
        "Tell me more!",
      ];
      
      const randomResponse = responses[Math.floor(Math.random() * responses.length)];
      
      const responseMessage: Message = {
        id: (Date.now() + 1).toString(),
        senderId: conversations.find(c => c.id === conversationId)?.user.id || '',
        receiverId: 'current-user',
        content: randomResponse,
        timestamp: new Date(),
        read: false,
      };
      
      setMessages(prev => ({
        ...prev,
        [conversationId]: [...(prev[conversationId] || []), responseMessage],
      }));

      setConversations(prev =>
        prev.map(conv =>
          conv.id === conversationId
            ? { 
                ...conv, 
                lastMessage: responseMessage,
                unreadCount: conv.unreadCount + 1
              }
            : conv
        )
      );
    }, 1000 + Math.random() * 2000);
  };

  const markAsRead = (conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId
          ? { ...conv, unreadCount: 0 }
          : conv
      )
    );

    setMessages(prev => ({
      ...prev,
      [conversationId]: (prev[conversationId] || []).map(msg =>
        msg.receiverId === 'current-user' ? { ...msg, read: true } : msg
      ),
    }));
  };

  const getUnreadCount = () => {
    return conversations.reduce((total, conv) => total + conv.unreadCount, 0);
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        messages,
        sendMessage,
        markAsRead,
        getUnreadCount,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
