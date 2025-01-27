import Users from "./users.interface";
import Message from "./message.interface";

interface Chat {
	id?: number;
	user: Users;
	targetUser: Users;
	messages?: Message[];
	createdAt?: Date;
}

export default Chat;
