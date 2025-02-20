import { forwardRef, Inject, Logger } from '@nestjs/common';
import { SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import Message from 'src/interface/message.interface';
import { SocketsService } from 'src/sockets.service';
import ChatService from './chat.service';

@WebSocketGateway()
class ChatGateway {
	@WebSocketServer()
	server: Server;
	private logger: Logger = new Logger('ChatGateway');

	constructor(
		@Inject(forwardRef(() => ChatService))
		private readonly chatService: ChatService,
		private readonly socketService: SocketsService,
	) {}

	@SubscribeMessage(`JoinRoom`)
	async handleJoinRoom(client: Socket, room: string) {
		client.rooms.forEach((room) => {
			client.leave(room);
		});
		const id = room.split('_')[1];
		const userId = this.socketService.getUserId(client);
		const bo = await this.chatService.getUserIdChat(Number(userId), Number(id))
		if (!bo)
			return;
		client.join(room);
		const messages = await this.chatService.getMessagesByChatId(Number(id));
		client.emit('receiveMessages', messages);
		this.logger.log(`Client ${client.id} joining room ${room}`);
	}

	emitMessage(message: Message): void {
		const room = `chat_${message.chatId}`;
		this.server.to(room).emit('receiveMessage', message);
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