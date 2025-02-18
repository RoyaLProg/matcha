import Users from "./users.interface";

export enum MessageType {
	Text = "text",
	Audio = "audio",
	Video = "video",
}

interface Message {
	id?: number;
	chatId: number;
	userId: number;
	type?: MessageType;
	content: string | null;
	fileUrl: string | null;
	createdAt?: Date;
}

export default Message;
