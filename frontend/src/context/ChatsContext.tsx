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

const sortMessages = (messages: Message[]) => {
	return messages.sort((a, b) => (a.createdAt?.getTime() ?? 0) - (b.createdAt?.getTime() ?? 0));
};

export default function ChatsProvider({ children } : { children: ReactNode }) {
	const [chats, setChats] = useState<Chat[]>();
	const user = useContext(UserContext);
	const socket = useContext(WebSocketContext)

	const fetchChats = async () => {
		if (!user) return;
		try {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/chat/me`, {
				method: "GET",
				credentials: "include",
			});
			const data = await response.json();
			const updatedChats = await Promise.all(
				data.map(async (chat: IChat) => {
					chat.messages = await sortMessages(chat.messages!);
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
				const response = await fetch(`${import.meta.env.VITE_API_URL}/chat/sendmessage`, {
					method: "POST",
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
