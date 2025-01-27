import Users from "./users.interface";

export enum ActionStatus {
	Like = "like",
	Dislike = "dislike",
}

interface Action {
	id?: number;
	user?: Users;
	targetUser?: Users;
	status: ActionStatus;
}

export default Action;
