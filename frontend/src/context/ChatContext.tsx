import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";

interface Message {
	id: number;
	content: string;
	senderId: number;
	createdAt: string;
}

interface Chat {
	id: number;
	name: string;
}

interface ChatContextType {
	selectedChat: Chat | undefined;
	messages: Message[] | undefined;
	selectChat: (chat: Chat) => void;
	sendMessage: (content: string) => void;
	refreshMessages: () => void;
}

export const ChatContext = createContext<ChatContextType | undefined>(undefined);

export default function ChatProvider({ children } : { children: ReactNode }) {
	const [selectedChat, setSelectedChat] = useState<Chat | undefined>(undefined);
	const [messages, setMessages] = useState<Message[] | undefined>(undefined);
	const socket = useContext(WebSocketContext);

	const fetchMessages = async (chatId: number) => {
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/${chatId}/messages`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
				},
			});
			if (!response.ok) {
				throw new Error("Failed to fetch messages");
			}
			const data = await response.json();
			setMessages(data);
		} catch (error) {
			console.error("Error fetching messages:", error);
		}
	};

	const selectChat = (chat: Chat) => {
		setSelectedChat(chat);
		fetchMessages(chat.id);
	};

	const refreshMessages = () => {
		if (selectedChat) {
			fetchMessages(selectedChat.id);
		}
	};

	const sendMessage = async(content: string) => {
		if (selectedChat) {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/sendmessage`, {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						userId: 1,
						targetUserId: selectedChat.id,
						message: content,
					}),
				});
				if (!response.ok)
					throw new Error("Failed to send message");
				const newMessage: Message = await response.json();
				setMessages((prevMessages) => (prevMessages ? [...prevMessages, newMessage] : [newMessage]));
			} catch (error) {
				console.error("Error sending message:", error);
			}
		}
	}

	useEffect(() => {
		if (socket) {
			socket.on("receiveMessage", (newMessage: Message) => {
				if (newMessage.id === selectedChat?.id) {
					setMessages((prevMessages) =>
						prevMessages ? [...prevMessages, newMessage] : [newMessage]
					);
				}
			});
		}
	}, [socket]);

	return (<ChatContext.Provider value={{ selectedChat, messages, selectChat, sendMessage, refreshMessages }}>
				{children}
			</ChatContext.Provider>);
}
