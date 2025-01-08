import { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { toast, ToastContainer } from "react-toastify";
import { io, Socket } from "socket.io-client";
import { UserContext } from './UserContext';
import 'react-toastify/dist/ReactToastify.css';

const WebSocketContext = createContext<Socket | undefined>(undefined);

enum NotificationType {
	Info,
	Success,
	Warning,
	Error
}

interface Notification {
	type: NotificationType;
	message: string;
}

function WebSocketProvider({ children }: { children: ReactNode }) {
	const user = useContext(UserContext);
	const [socket, setSocket] = useState<Socket | undefined>(undefined);

	useEffect(() => {
		if (user && user.token) {
			const socketIOClient = io(`${import.meta.env.VITE_API_URL}`, {
				extraHeaders: {
					Authorization: `Bearer ${user.token}`,
				},
			});
			setSocket(socketIOClient);
			socketIOClient.on("notification", (notification: Notification) => {
				const notificationFunctions = {
					[NotificationType.Info]: toast.info,
					[NotificationType.Success]: toast.success,
					[NotificationType.Warning]: toast.warning,
					[NotificationType.Error]: toast.error,
				};
				notificationFunctions[notification.type](notification.message);
			});
			return () => {
				socketIOClient.off("connect");
				socketIOClient.disconnect();
			};
		}
	}, [user?.token]);
	const value = useMemo(() => socket, [socket]);
	return (
		<WebSocketContext.Provider value={value}>
			{children}
			<ToastContainer />
		</WebSocketContext.Provider>
	);

}

export { WebSocketProvider, WebSocketContext, NotificationType, Notification };
