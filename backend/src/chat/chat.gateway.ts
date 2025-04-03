import { forwardRef, Inject, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Message from 'src/interface/message.interface';
import { NotificationType, SocketsService } from 'src/sockets.service';
import ChatService from './chat.service';
import { Database } from 'src/database/Database';
import Chat from 'src/interface/chat.interface';
import UserService from 'src/user/user.service';

const joiningUsers = new Map<string, boolean>(); //

@WebSocketGateway()
class ChatGateway {
	@WebSocketServer()
	server: Server;
	private logger: Logger = new Logger('ChatGateway');

	constructor(
		@Inject(forwardRef(() => ChatService))
		private readonly chatService: ChatService,
		private readonly socketService: SocketsService,
		private readonly dataBase: Database,
		private readonly userService: UserService,
	) {}

	@SubscribeMessage(`JoinRoom`)
	async handleJoinRoom(client: Socket, room: string) {
		if (joiningUsers.get(client.id)) {
			this.logger.warn(`Client ${client.id} tried to join room ${room} multiple times`);
			return;
		  }

		  joiningUsers.set(client.id, true);

		  try {
			// Quitte toutes les rooms sauf la room personnelle
			for (const joinedRoom of client.rooms) {
			  if (joinedRoom !== client.id) {
				client.leave(joinedRoom);
			  }
			}

			if (client.rooms.has(room)) {
			  this.logger.log(`Client ${client.id} already in room ${room}`);
			  return;
			}

			const id = room.split('_')[1];
			const userId = this.socketService.getUserId(client);

			const hasAccess = await this.chatService.getUserIdChat(Number(userId), Number(id));
			if (!hasAccess) return;

			await client.join(room);

			const messages = await this.chatService.getMessagesByChatId(Number(id));
			client.emit('receiveMessages', messages);

			this.logger.log(`Client ${client.id} joined room ${room}`);
		  } catch (error) {
			this.logger.error(`Error while client ${client.id} joined room ${room}`, error);
		  } finally {
			joiningUsers.delete(client.id); // Libère le "lock"
		  }
	}

	async emitMessage(message: Message) {
		const room = `chat_${message.chatId}`;
		this.server.to(room).emit('receiveMessage', message);
		const chat = await this.dataBase.getFirstRow('chat', [], { id: message.chatId }) as Chat;
		const socketsInRoom = await this.server.in(room).fetchSockets();
		const recevidId = chat.userId === message.userId ? chat.targetUserId : chat.userId;
		console.log (recevidId);
		const socket = this.socketService.getSocketByUserId(recevidId.toString());
		console.log(socket?.id);
		if (socket?.id) {
			const isSocketInRoom = socketsInRoom.some(s => s.id === socket.id);
			if (!isSocketInRoom) {
				this.socketService.getNotificationByUserId(
					recevidId.toString(),
					NotificationType.Info,
					`Nouveau message de ${(await this.userService.findOne(message.userId)).username}`
				);
				socket.emit('chat1');
				this.logger.log(`Message envoyé à user ${recevidId} (socket ${socket.id}) en dehors de la room`);
			}
		}
		this.logger.log(`Message émis à la room ${room}: ${JSON.stringify(message)}`);
	}

	@SubscribeMessage(`LeaveRoom`)
	handleLeaveRoom(client: Socket, room: string) {
		if (client.rooms.has(room)) {
			client.leave(room);
			this.logger.log(`Client ${client.id} leaving room ${room}`);
		} else {
			this.logger.error(`Client ${client.id} is not in room ${room}`);
		}
	}
}

export default ChatGateway;