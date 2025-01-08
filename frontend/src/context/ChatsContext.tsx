import { createContext, ReactNode, useContext, useEffect, useState } from "react";
import { WebSocketContext } from "./WebSocketContext";
import { UserContext } from "./UserContext";

interface Chat {
	id: number,
	name: string,
	lastMessage?: string,
}

interface ChatsContextType {
	chats: Chat[] | undefined;
	refreshChats: () => void;
}

const ChatsContext = createContext<ChatsContextType | undefined>(undefined);

function ChatsProvider({ children } : { children: ReactNode }) {
	const [chats, setChats] = useState<Chat[]>();
	const user = useContext(UserContext);
	const socket = useContext(WebSocketContext)
	const fetchChats = async () => {
		if (user) {
			const response = await fetch(`${import.meta.env.VITE_API_URL}/chats?userId=${user.id}`, {
				method: "GET",
				headers: {
					"Content-Type": "application/json",
					Authorization: `Bearer ${user.token}`,
				},
			});
			const data = await response.json();
			setChats(data);
		}
	};
	useEffect(() => {
		if (user && socket) {
			fetchChats();
			socket.on(`newChat`, (newChat: Chat) => {
				setChats((prevChats) => {
					if (!prevChats) return [newChat];
					if (!prevChats.find((chat) => chat.id === newChat.id))
						return [...prevChats, newChat];
					return prevChats;
				});
			});
		}
	}, [socket]);
	const refreshChats = async () => {
		await fetchChats();
	};
	return (<ChatsContext.Provider value={{ chats, refreshChats }}>
				{children}
			</ChatsContext.Provider>);
}
export { ChatsProvider, ChatsContext };
