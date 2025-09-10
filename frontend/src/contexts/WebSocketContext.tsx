import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { toast, ToastContainer } from "react-toastify";
import { io, Socket } from "socket.io-client";
import { UserContext } from '../contexts/UserContext';
import 'react-toastify/dist/ReactToastify.css';

export const WebSocketContext = createContext<Socket | undefined>(undefined);

export enum NotificationType {
	Info,
	Success,
	Warning,
	Error
}

export interface Notification {
	type: NotificationType;
	message: string;
}

export const notificationFunctions = {
	[NotificationType.Info]: toast.info,
	[NotificationType.Success]: toast.success,
	[NotificationType.Warning]: toast.warning,
	[NotificationType.Error]: toast.error,
};

export default function WebSocketProvider({ children }: { children: ReactNode }) {
	const user = useContext(UserContext);
	const [socket, setSocket] = useState<Socket | undefined>(undefined);

	useEffect(() => {
		// Connect WebSocket as soon as there's an auth cookie, even if user context is still loading
		const hasAuthCookie = typeof document !== 'undefined' && 
			document.cookie.includes('Auth=');
		
		if (user || hasAuthCookie) {
			const socketIOClient = io(`${import.meta.env.VITE_API_URL}`, {
				withCredentials: true,
				transports: ["websocket", "polling"],
			});
			socketIOClient.on("connect", () => {
				setSocket(socketIOClient);
			});
			socketIOClient.on("notification", (notification: Notification) => {
				notificationFunctions[notification.type](notification.message);
			});
			return () => {
				socketIOClient.off("connect");
				socketIOClient.off("notification");
				socketIOClient.disconnect();
			};
		}
	}, [user]);
	const value = useMemo(() => socket, [socket]);
	return (
		<WebSocketContext.Provider value={value}>
			{children}
			<ToastContainer />
		</WebSocketContext.Provider>
	);

}
