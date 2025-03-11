interface History {
	id?: Number;
	userId: Number;
	fromId: Number;
	message: string;
	createdAt?: Date;
	isReaded?: boolean;
}

export default History;
