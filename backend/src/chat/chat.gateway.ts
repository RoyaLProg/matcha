import { forwardRef, Inject, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Message from 'src/interface/message.interface';
import { NotificationType, SocketsService } from 'src/sockets.service';
import ChatService from './chat.service';
import { Database } from 'src/database/Database';
import Chat from 'src/interface/chat.interface';
import UserService from 'src/user/user.service';

const joiningUsers = new Map<string, boolean>();

@WebSocketGateway({
    cors: {
        origin: process.env.URL || 'http://localhost:8080',
        methods: ["GET", "POST"],
        allowedHeaders: ["Authorization", "Content-Type"],
        credentials: true,
    },
})
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

			const chat = await this.dataBase.getFirstRow('chat', [], { id: Number(id) }) as Chat;
			const me = await this.dataBase.getFirstRow('users', [], { id: Number(userId) });
			const otherId = chat.userId === Number(userId) ? chat.targetUserId : chat.userId;
			const other = await this.dataBase.getFirstRow('users', [], { id: otherId });
			if ((Array.isArray(me?.blockedIds) && me.blockedIds.includes(otherId)) || (Array.isArray(other?.blockedIds) && other.blockedIds.includes(Number(userId)))) {
				return;
			}

			await client.join(room);

			const messages = await this.chatService.getMessagesByChatId(Number(id));
			client.emit('receiveMessages', messages);

			this.logger.log(`Client ${client.id} joined room ${room}`);
		  } catch (error) {
			this.logger.error(`Error while client ${client.id} joined room ${room}`, error);
		  } finally {
			joiningUsers.delete(client.id);
		  }
	}

	async emitMessage(message: Message) {
		const room = `chat_${message.chatId}`;
		this.server.to(room).emit('receiveMessage', message);
		const chat = await this.dataBase.getFirstRow('chat', [], { id: message.chatId }) as Chat;
		const socketsInRoom = await this.server.in(room).fetchSockets();
		const recevidId = chat.userId === message.userId ? chat.targetUserId : chat.userId;
		const socket = this.socketService.getSocketByUserId(recevidId.toString());
		if (socket?.id) {
			const isSocketInRoom = socketsInRoom.some(s => s.id === socket.id);
			if (!isSocketInRoom) {
					this.socketService.getNotificationByUserId(
						recevidId.toString(),
						NotificationType.Info,
						`Nouveau message de ${(await this.userService.findOne(message.userId)).username}`
					);
				this.logger.log(`Message envoyé à user ${recevidId} (socket ${socket.id}) en dehors de la room`);
			}
		}
		this.logger.log(`Message émis à la room ${room}: ${JSON.stringify(message)}`);
	}

	@SubscribeMessage('webrtc-offer')
	async handleWebRTCOffer(client: Socket, payload: any) {
		try {
			const userId = this.socketService.getUserId(client);
			const chatId = Number(payload.chatId);
			if (!await this.chatService.getUserIdChat(Number(userId), chatId)) return;
			const chat = await this.dataBase.getFirstRow('chat', [], { id: chatId }) as Chat;
			const recevidId = chat.userId === Number(userId) ? chat.targetUserId : chat.userId;
			this.socketService.getSocketByUserId(recevidId.toString())?.emit('webrtc-offer', {
				chatId,
				offer: payload.offer,
				type: payload.type,
				fromUserId: Number(userId)
			});
		} catch (e) {}
	}

	@SubscribeMessage('webrtc-answer')
	async handleWebRTCAnswer(client: Socket, payload: any) {
		try {
			const userId = this.socketService.getUserId(client);
			const chatId = Number(payload.chatId);
			if (!await this.chatService.getUserIdChat(Number(userId), chatId)) return;
			const chat = await this.dataBase.getFirstRow('chat', [], { id: chatId }) as Chat;
			const recevidId = chat.userId === Number(userId) ? chat.targetUserId : chat.userId;
			this.socketService.getSocketByUserId(recevidId.toString())?.emit('webrtc-answer', {
				chatId,
				answer: payload.answer,
				fromUserId: Number(userId)
			});
		} catch (e) {}
	}

	@SubscribeMessage('webrtc-ice-candidate')
	async handleWebRTCIceCandidate(client: Socket, payload: any) {
		try {
			const userId = this.socketService.getUserId(client);
			const chatId = Number(payload.chatId);
			if (!await this.chatService.getUserIdChat(Number(userId), chatId)) return;
			const chat = await this.dataBase.getFirstRow('chat', [], { id: chatId }) as Chat;
			const recevidId = chat.userId === Number(userId) ? chat.targetUserId : chat.userId;
			this.socketService.getSocketByUserId(recevidId.toString())?.emit('webrtc-ice-candidate', {
				chatId,
				candidate: payload.candidate,
				fromUserId: Number(userId)
			});
		} catch (e) {}
	}

	@SubscribeMessage('webrtc-hangup')
	async handleWebRTCHangup(client: Socket, payload: any) {
		try {
			const userId = this.socketService.getUserId(client);
			const chatId = Number(payload.chatId);
			if (!await this.chatService.getUserIdChat(Number(userId), chatId)) return;
			const chat = await this.dataBase.getFirstRow('chat', [], { id: chatId }) as Chat;
			const recevidId = chat.userId === Number(userId) ? chat.targetUserId : chat.userId;
			this.socketService.getSocketByUserId(recevidId.toString())?.emit('webrtc-hangup', { chatId, fromUserId: Number(userId) });
		} catch (e) {}
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
