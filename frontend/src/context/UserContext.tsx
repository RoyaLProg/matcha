import { createContext, useState, useEffect, ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';
import Users, { UserStatus } from '../interface/users.interface';
import Settings from '../interface/settings.interface';

interface UserContextProp {
	user: Users | undefined;
	setUser: (user: Users | undefined) => void;
	updateUserFromCookie: () => void;
	setUserSettings: (settings: any) => void;
}

export const getCookie = (name) => {
	return document.cookie
		.split('; ')
		.find(row => row.startsWith(name + '='))
		?.split('=')[1];
};

export const fetchLocationByIP = async () :Promise<Partial<Settings> | null> => {
	try {
		const response = await fetch('http://ip-api.com/json/');
		if (!response.ok) throw new Error('Failed to fetch location by IP');
		const data = await response.json();
		return { latitude: data.lat, longitude: data.lon, country: data.country || 'Unknown', city: data.city || 'Unknown' };
	} catch (error) {
		console.error('Failed to fetch location by IP:', error);
		return null;
	}
};

export const UserContext = createContext<UserContextProp | undefined>(undefined);

export default function UserProvider({ children }: { children: ReactNode }) {
	const [user, setUser] = useState<Users | undefined>(undefined);

	const updateUserSettingsAPI = async (settings: Partial<Settings>) => {
		try {
			const formData = new FormData();
			formData.append('data', JSON.stringify(settings));

			const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/settings`, {
				method: 'PATCH',
				body: formData,
				credentials: 'include',
			});

			if (!response.ok)
				throw new Error('Failed to update user settings');
		} catch (error) {
			console.error('Error updating user settings:', error);
		}
	};

	const updateUserFromCookie = async () => {
		if (typeof document === 'undefined') return;
		const token = getCookie("Auth");
		if (token) {
			try {
				const decodedUser: any = jwtDecode(token);
				if (decodedUser.exp && decodedUser.exp * 1000 < Date.now()) {
					console.error('Token expired');
					setUser(undefined);
					document.cookie = 'Auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
					return;
				}
				const responseUser = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
					method: 'GET',
					credentials: 'include',
				});
				if (responseUser.ok) {
					const fetchedUser: Users = await responseUser.json();
					setUser({ ...fetchedUser, status: UserStatus.Online });
					if (fetchedUser.settings)
						if (fetchedUser.settings?.geoloc) {
							navigator.geolocation.getCurrentPosition(
								async (position) => {
									const { latitude, longitude } = position.coords;
									const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
									const data = await response.json();
									if (data) {
										const updatedSettings: Partial<Settings> = { latitude, longitude, country: data.countryName || 'Unknown', city: data.city || 'Unknown' };
										setUserSettings(updatedSettings);
										updateUserSettingsAPI(updatedSettings);
									}
								},
								async (error) => {
									console.error('Failed to get geolocation:', error);
									const location = await fetchLocationByIP();
									if (location) {
										setUserSettings(location);
										updateUserSettingsAPI(location);
									}
								}
						);
						} else {
							const location = await fetchLocationByIP();
							if (location) {
								setUserSettings(location);
								updateUserSettingsAPI(location);
							}
						}
				} else {
					console.error('Failed to fetch user data');
					document.cookie = 'Auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
					setUser(undefined);
				}
			} catch (error) {
				console.error('Error during token processing:', error);
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
