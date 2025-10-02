import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { UserContext } from "./UserContext";
import Chat from "../interface/chat.interface";
import Message from "../interface/message.interface";

interface ChatContextType {
  chats: Chat[] | undefined;
  refreshChats: () => void;
  sendMessage: (newMessage: Message) => void;
  sendMediaMessage: (chatId: number, file: File, type: "audio" | "video") => void;
}

interface IChat extends Chat {}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

const sortMessages = (messages: Message[]): Message[] => {
  if (!Array.isArray(messages)) return [];
  return messages.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeA - timeB;
  });
};

const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [chats, setChats] = useState<Chat[]>();
  const userCtx = useContext(UserContext);
  const socket = useContext(WebSocketContext)

  const fetchChats = async () => {
    if (!userCtx?.user) {
      console.log("ChatContext: No user context, skipping fetch");
      return;
    }
    try {
      console.log("ChatContext: Fetching chats for user", userCtx.user.id);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/`, {
        method: "GET",
        credentials: "include",
      });
      console.log("ChatContext: Response status", response.status);
      if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
      const data = await response.json();
      console.log("ChatContext: Received data", data);

      if (!Array.isArray(data)) {
        console.log("ChatContext: Data is not an array, setting empty chats");
        return setChats([]);
      }
      const updatedChats = await Promise.all(
        data.map(async (chat: IChat) => {
          if (!Array.isArray(chat.messages)) chat.messages = [];
          else chat.messages = await sortMessages(chat.messages);
          return chat;
        })
      );
      console.log("ChatContext: Setting chats", updatedChats);
      setChats(updatedChats);

    } catch (error) {
      console.error("Erreur lors de la récupération des chats :", error);
    }
  };

  useEffect(() => {
    if (!userCtx?.user || !socket) return;
    fetchChats();
    const handleNewChat = (newChat: Chat) => {
      console.log("ChatContext: Received newChat event", newChat);
      setChats((prevChats) => {
        console.log("ChatContext: Current chats before update", prevChats);
        if (!prevChats) {
          console.log("ChatContext: No previous chats, setting new chat");
          return [newChat];
        }
        if (!prevChats.find((chat) => chat.id === newChat.id)) {
          console.log("ChatContext: Chat not found, adding new chat");
          return [...prevChats, newChat];
        }
        console.log("ChatContext: Chat already exists, no update");
        return prevChats;
      });
    };
    const handleReceiveMessage = async (newMessage: Message) => {
      setChats((prevChats) => {
        if (!prevChats) return prevChats;
        return prevChats.map((chat) => {
          if (chat.id === newMessage.chatId) {
            return {
              ...chat,
              messages: [...(chat.messages ?? []), newMessage].sort(
                (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
              ),
            };
          }
          return chat;
        });
      });
    };
    const handleReceiveMessages = async (newMessages: Message[]) => {
      setChats((prevChats) => {
        if (!prevChats) return prevChats;
        return prevChats.map((chat) => {
          const messagesForChat = newMessages?.filter(msg => msg.chatId === chat.id);
          if (messagesForChat?.length === 0) return chat;
          return {
            ...chat,
            messages: messagesForChat?.sort(
              (a, b) => new Date(a.createdAt!).getTime() - new Date(b.createdAt!).getTime()
            ),
          };
        });
      });
    };
    socket.on('newChat', handleNewChat);
    socket.on("receiveMessage", handleReceiveMessage);
    socket.on('receiveMessages', handleReceiveMessages);
    return () => {
      socket.off('newChat', handleNewChat);
      socket.off("receiveMessage", handleReceiveMessage);
      socket.off('receiveMessages', handleReceiveMessages);
    };
  }, [socket, userCtx?.user]);

  const refreshChats = async () => {
    await fetchChats();
  };

  const sendMessage = async (newMessage: Message) => {
    if (newMessage.chatId) {
      try {
        const payload = {
          chatId: newMessage.chatId,
          content: newMessage.content,
          type: newMessage.type,
        };
        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/sendmessage`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message: payload }),
        });
        if (!response.ok) throw new Error("Failed to send message");
      } catch (error) {
        console.error("Error sending message:", error);
      }
    }
  }

  const sendMediaMessage = async (chatId: number, file: File, type: "audio" | "video") => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const apiUrl = `${import.meta.env.VITE_API_URL}/api/upload/${chatId}/${type}`;

      const response = await fetch(apiUrl, {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (!response.ok) throw new Error(`Failed to send ${type} message`);
    } catch (error) {
      console.error(`Error sending ${type} message:`, error);
    }
  };

  return (
    <ChatContext.Provider value={{ chats, refreshChats, sendMessage, sendMediaMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export default ChatProvider;
