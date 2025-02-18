import Users from "./users.interface";
import Message from "./message.interface";

interface Chat {
	id?: number;
	user?: Users;
	userId: number;
	targetUser?: Users;
	targetUserId: number;
	messages?: Message[];
	createdAt?: Date;
}

export default Chat;
