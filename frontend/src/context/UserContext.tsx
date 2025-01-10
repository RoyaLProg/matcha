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

const UserContext = createContext< User | undefined >(undefined);

function UserProvider({ children } : { children: ReactNode }) {
	const [user, setUser] = useState<IUser | undefined>(undefined);
// check si le cookie n'existe pas deja
	useEffect(() => {
		const auth = document.cookie.split('; ').find(row => row.startsWith('Auth='));
		if (auth) {
			const { decodedToken, isExpired } = useJwt(auth);
			if (isExpired) {
				document.cookie = 'Auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
				return;
			}
			setUser(decodedToken as IUser);
		}
	}, []);
	return (
		<UserContext.Provider value={{ user, setUser }}>
			{children}
		</UserContext.Provider>
	);
}

export { UserProvider, UserContext };