interface History {
	id?: number;
	userId: number;
	message: string;
	createdAt?: Date;
	readed?: boolean;
}

export default History;
