export enum TokenType {
	PASS_RESET = "password",
	CREATE = "create",
}

interface Auth {
	id?: number;
	userId?: string;
	token: string;
	type: TokenType;
	createdAt?: Date;
}

export default Auth;
