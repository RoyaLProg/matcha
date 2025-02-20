import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { UserContext } from "./UserContext";
import Chat from "../interface/chat.interface";
import Message from "../interface/message.interface";

interface ChatsContextType {
	chats: Chat[] | undefined;
	refreshChats: () => void;
	sendMessage: (newMessage: Message) => void;
	sendMediaMessage:(chatId: number, file: File, type: "audio" | "video") => void;
}

interface IChat extends Chat {}

export const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

const sortMessages = (messages: Message[]): Message[] => {
	if (!Array.isArray(messages))
		return [];

	return messages.sort((a, b) => {
		const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
		const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
		return timeA - timeB;
	});
};

// function a jouter pour mettre a jour le chat message quand on vas sur le message dans chat.tsx
export default function ChatsProvider({ children } : { children: ReactNode }) {
	const [chats, setChats] = useState<Chat[]>();
	const user = useContext(UserContext);
	const socket = useContext(WebSocketContext)

	const fetchChats = async () => {
		if (!user) return;
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/`, {
				method: "GET",
				credentials: "include",
			});
			if (!response.ok) throw new Error(`Erreur API: ${response.status}`);
			const data = await response.json();
			console.log("📩 Données des chats reçues :", data);

			if (!Array.isArray(data))
				return setChats([]);
			const updatedChats = await Promise.all(
				data.map(async (chat: IChat) => {
					if (!Array.isArray(chat.messages))
						chat.messages = [];
					else
						chat.messages = await sortMessages(chat.messages);
					return chat;
				})
			);
			setChats(updatedChats);

		} catch (error) {
			console.error("Erreur lors de la récupération des chats :", error);
		}
	};

	useEffect(() => {
		if (!user || !socket) return;
		fetchChats();
		const handleNewChat = (newChat: Chat) => {
			setChats((prevChats) => {
				if (!prevChats) return [newChat];
				if (!prevChats.find((chat) => chat.id === newChat.id))
					return [...prevChats, newChat];
				return prevChats;
			});
		};
		const handleReceiveMessage = async (newMessage: Message) => {
			console.log(newMessage);
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
			console.log(newMessages);
			setChats((prevChats) => {
				if (!prevChats) return prevChats;
				return prevChats.map((chat) => {
					const messagesForChat = newMessages.filter(msg => msg.chatId === chat.id);
					if (messagesForChat.length === 0) return chat;
					return {
						...chat,
						messages: messagesForChat.sort(
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
	}, [socket]);

	const refreshChats = async () => {
		await fetchChats();
	};

	const sendMessage = async(newMessage: Message) => {
		if (newMessage.chatId) {
			try {
				const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/sendmessage`, {
					method: "POST",
					credentials: "include",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({message: newMessage}),
				});
				if (!response.ok) throw new Error("Failed to send message");
				const sentMessage: Message = await response.json();
				// setChats((prevChats) =>
				// 	prevChats?.map((chat) =>
				// 		chat.id === sentMessage.chatId
				// 			? { ...chat, messages: sortMessages([...(chat.messages ?? []), sentMessage]) }
				// 			: chat
				// 	)
				// );
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

			// 🔥 On récupère le message créé
			const mediaMessage = await response.json();
			console.log(mediaMessage)
			const messageData = mediaMessage[type];

			console.log(messageData);
			// setChats((prevChats) =>
			// 	prevChats?.map((chat) =>
			// 		chat.id === chatId
			// 			? { ...chat, messages: sortMessages([...(chat.messages ?? []), messageData]) }
			// 			: chat
			// 	)
			// );
		} catch (error) {
			console.error(`Error sending ${type} message:`, error);
		}
	};

	return (<ChatsContext.Provider value={{ chats, refreshChats, sendMessage, sendMediaMessage }}>
				{children}
			</ChatsContext.Provider>);
}
