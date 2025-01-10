import { createContext, useState, ReactNode, useEffect } from 'react';
import { useJwt } from 'react-jwt';

interface IUser {
	id: string;
	firstName: string;
	lastName: string;
	email: string;
	birthDate: Date;
	username: string;
	status: string;
	biography: string;
	pictures: string[];
	tags: string
}

const UserContext = createContext< UserContextProp | undefined >(undefined);

function UserProvider({ children } : { children: ReactNode }) {
	const [user, setUser] = useState<Object | undefined>(undefined);
	return (
		<UserContext.Provider value={ {user: user, setUser: setUser} }>
			{children}
		</UserContext.Provider>
	);
}

export { UserProvider, UserContext };
