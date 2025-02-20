import { Injectable } from '@nestjs/common';
import { Socket } from 'socket.io';

enum NotificationType {
	Info,
	Success,
	Warning,
	Error
}

type userInfo = {
	userId: string
}

@Injectable()
class SocketsService {
	private socketUsers: Map<Socket, userInfo> = new Map();

	addSocket(socket: Socket, userId: string) {
		this.socketUsers.set(socket, { userId });
	}

	removeSocket(socket: Socket): { userId: string } | undefined {
		if (!this.socketUsers.has(socket))
			return undefined;
		const user: userInfo = this.socketUsers.get(socket);
		this.socketUsers.delete(socket);
		return user;
	}

	getUserId(socket: Socket): string | undefined {
		if (!this.socketUsers.has(socket))
			return undefined;
		return this.socketUsers.get(socket).userId;
	}

	getSocketByUserId(userId: string): Socket | undefined {
		for (const [socket, user] of this.socketUsers.entries()) {
			if (user.userId === userId) {
				return socket;
			}
		}
		return undefined; // Si aucun socket n'est trouvé
	}

}

export { SocketsService, NotificationType };