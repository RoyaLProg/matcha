import { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import Users from '../interface/users.interface';

interface IUser extends Users {}

interface UserContextProp {
	user: IUser | undefined;
	setUser: (user: IUser | undefined) => void;
	updateUserFromCookie: () => void;
	setUserSettings: (settings: any) => void;
}

export const cookies = document.cookie.split('; ').reduce((acc, cookie) => {
	const [key, value] = cookie.split('=');
	acc[key] = decodeURIComponent(value);
	return acc;
}, {} as Record<string, string>);

export const UserContext = createContext<UserContextProp | undefined>(undefined);

export default function UserProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<IUser | undefined>(undefined);
	// recupere faire un fetch getUser avec le token
	const updateUserFromCookie = () => {
		if (typeof document === 'undefined') return;
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

	const setUserSettings = (settings: any) => {
		if (!user) return;
		setUser({ ...user, settings });
	}

	useEffect(() => {
		updateUserFromCookie();
	}, []);

	return (
		<UserContext.Provider value={{ user, setUser, updateUserFromCookie, setUserSettings }}>
			{children}
		</UserContext.Provider>
	);
}
