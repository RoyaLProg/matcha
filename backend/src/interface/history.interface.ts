import Users from "./users.interface";

interface History {
	id?: number;
	user: Users;
	message: string;
	createdAt?: Date;
	isRead: boolean;
}

export default History;
