import { createContext, useState, ReactNode } from 'react';

interface User {
	id: string;
	token: string;
}

const UserContext = createContext<{ user: User | null }>({ user: null });

function UserProvider({ children } : { children: ReactNode }) {
	const [user, setUser] = useState<User | null>({
		id: '123',
		token: 'your-jwt-token',
	});
	return (
		<UserContext.Provider value={{ user }}>
			{children}
		</UserContext.Provider>
	);
}

export { UserProvider, UserContext };