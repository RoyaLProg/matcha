import Users from "./users.interface";

export enum TokenType {
	PASS_RESET = "password",
	CREATE = "create",
}

interface Auth {
	id?: number;
	user?: Users;
	token: string;
	type: TokenType;
	createdAt?: Date;
}

export default Auth;
