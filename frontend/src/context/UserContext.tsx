import { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

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
	tags: string[];
}

interface UserContextProp {
	user: IUser | undefined;
	setUser: (user: IUser | undefined) => void;
	updateUserFromCookie: () => void;
}

const UserContext = createContext<UserContextProp | undefined>(undefined);

function UserProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<IUser | undefined>(undefined);

	const updateUserFromCookie = () => {
		const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
			const [key, value] = cookie.split('=');
			acc[key] = value;
			return acc;
		}, {} as Record<string, string>);
		const token = cookies['Auth'];
		if (token) {
			try {
				const decodedUser = jwtDecode<IUser>(token);
				if (decodedUser.exp && decodedUser.exp * 1000 < Date.now()) {
					console.error('Token expired');
					setUser(undefined);
					return;
				}
				setUser(decodedUser);
			} catch (error) {
				console.error('Invalid token:', error);
				setUser(undefined);
			}
		} else {
			console.error('No token found');
			setUser(undefined);
		}
	};

	useEffect(() => {
		updateUserFromCookie();
	}, []);

	return (
		<UserContext.Provider value={{ user, setUser, updateUserFromCookie }}>
			{children}
		</UserContext.Provider>
	);
}

export { UserProvider, UserContext };
