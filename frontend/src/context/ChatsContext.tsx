import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { UserContext } from "./UserContext";
import Chat from "../interface/chat.interface";
import Message from "../interface/message.interface";

interface ChatsContextType {
	chats: Chat[] | undefined;
	refreshChats: () => void;
	sendMessage: (newMessage: Message) => void;
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
			setChats((prevChats) => {
				if (!prevChats) return prevChats;

				return prevChats.map((chat) => {
					if (chat.id === newMessage.chatId) {
						return {
							...chat,
							messages: [...(chat.messages ?? []), newMessage].sort(
								(a, b) => a.createdAt!.getTime() - b.createdAt!.getTime()
							),
						};
					}
					return chat;
				});
			});
		};
		socket.on("newChat", handleNewChat);
		socket.on("receiveMessage", handleReceiveMessage);
		return () => {
			socket.off("newChat", handleNewChat);
			socket.off("receiveMessage", handleReceiveMessage);
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
				setChats((prevChats) =>
					prevChats?.map((chat) =>
						chat.id === sentMessage.chatId
							? { ...chat, messages: sortMessages([...(chat.messages ?? []), sentMessage]) }
							: chat
					)
				);
			} catch (error) {
				console.error("Error sending message:", error);
			}
		}
	}

	return (<ChatsContext.Provider value={{ chats, refreshChats, sendMessage }}>
				{children}
			</ChatsContext.Provider>);
}
