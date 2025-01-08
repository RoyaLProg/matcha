import { createContext, useState, ReactNode } from 'react';

interface User {
	id: string;
	token: string;
}

const UserContext = createContext< User | undefined >(undefined);

function UserProvider({ children } : { children: ReactNode }) {
	const [user, setUser] = useState<User | undefined>(undefined);
	return (
		<UserContext.Provider value={ user }>
			{children}
		</UserContext.Provider>
	);
}

export { UserProvider, UserContext };