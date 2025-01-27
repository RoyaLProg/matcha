import Chat from "./chat.interface";
import Users from "./users.interface";

export enum MessageType {
	Text = "text",
	Audio = "audio",
	Video = "video",
}

interface Message {
	id?: number;
	chat: Chat;
	sender: Users;
	type?: MessageType;
	content: string | null;
	fileUrl: string | null;
	createdAt?: Date;
}

export default Message;
