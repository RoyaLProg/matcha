import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/sonner';
import Users, { UserStatus } from '../interface/users.interface';
import Settings from '../interface/settings.interface';

interface User extends Users {
  profilePicture?: string;
  profileCompleted?: boolean;
  isLoadingUser: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresTwoFactor?: boolean; username?: string; error?: string }>;
  register: (userData: RegisterData) => Promise<{ success: boolean; needsConfirmation?: boolean; error?: string }>;
  logout: () => void;
  isLoggedIn: boolean;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  confirmEmail: (token: string) => Promise<boolean>;
  isLoadingUser: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  firstName: string;
  lastName: string;
  birthday: string;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function clearAuthCookie() {
}


export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  function getCookie(name: string): string | null {
    const m = document.cookie
      .split('; ')
      .find((row) => row.startsWith(name + '='));
    return m ? decodeURIComponent(m.split('=')[1]) : null;
  }

  const updateUserSettingsAPI = async (settings: Partial<Settings>) => {
    try {
      const allowed: (keyof Settings)[] = [
        'latitude',
        'longitude',
        'maxDistance',
        'geoloc',
        'minAgePreference',
        'maxAgePreference',
        'maxFameRating',
        'biography',
        'gender',
        'sexualOrientation',
      ];
      const payload = Object.fromEntries(
        Object.entries(settings || {}).filter(([k]) => (allowed as string[]).includes(k))
      );
      const formData = new FormData();
      formData.append('data', JSON.stringify(payload));

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
      try {
        const responseUser = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
          method: 'GET',
          credentials: 'include',
        });
        if (responseUser.ok) {
          const fetchedUser: User = await responseUser.json();
          setUser({ ...fetchedUser, status: UserStatus.Online });
          if (fetchedUser.settings) {
            if (fetchedUser.settings?.geoloc) {
              navigator.geolocation.getCurrentPosition(
                async (position) => {
                  const { latitude, longitude } = position.coords;
                  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`);
                  const data = await response.json();
                  if (data) {
                    const city = data.city || data.locality || data.principalSubdivision || '';
                    const country = data.countryName || '';
                    const updatedSettings: Partial<Settings> = { latitude, longitude, city, country };
                    setUserSettings(updatedSettings);
                    updateUserSettingsAPI(updatedSettings);
                  }
                },
                async (error) => {
                  console.error('Failed to get geolocation:', error);
                  const location = await fetchLocationByIP();
                  if (location) {
                    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`);
                    const data = await response.json();
                    const city = data?.city || data?.locality || data?.principalSubdivision || '';
                    const country = data?.countryName || '';
                    const updatedSettings = { latitude: location.latitude, longitude: location.longitude, city, country };
                    setUserSettings(updatedSettings);
                    updateUserSettingsAPI(updatedSettings);
                  }
                }
              );
            } else {
              const location = await fetchLocationByIP();
              if (location) {
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${location.latitude}&longitude=${location.longitude}&localityLanguage=en`);
                const data = await response.json();
                const city = data?.city || data?.locality || data?.principalSubdivision || '';
                const country = data?.countryName || '';
                const updatedSettings = { latitude: location.latitude, longitude: location.longitude, city, country };
                setUserSettings(updatedSettings);
                updateUserSettingsAPI(updatedSettings);
              }
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
  };

  const setUserSettings = (settings: any) => {
    if (!user) return;
    setUser({ ...user, settings });
  };


useEffect(() => {

    const init = async () => {
      const user = await updateUserFromCookie();

      setIsLoadingUser(false);
    };
    init();

}, []);


const fetchLocationByIP = async (): Promise<Partial<Settings> | null> => {
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

useEffect(() => {
  if (user) {
    console.log("🎯 Nouvelle valeur de user :", user, isLoggedIn);
    console.log(user, isLoggedIn, isLoadingUser);
  }
}, [user, isLoggedIn]);


  const login = async (username: string, password: string): Promise<{ success: boolean; requiresTwoFactor?: boolean; username?: string; error?: string }> => {
    try {
    const response = await fetch(import.meta.env.VITE_API_URL + "/api/auth/login", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        password,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      const errorMessage = data.message || "Erreur de connexion";
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    }

    if (data.requiresTwoFactor) {
      return {
        success: false,
        requiresTwoFactor: true,
        username: data.username
      };
    }

    await updateUserFromCookie();

    toast.success("Connexion réussie !");
	setIsLoggedIn(true);
    return { success: true };
  } catch (error) {
    console.error("Erreur lors du login :", error);
    const errorMessage = "Erreur réseau lors de la connexion";
    toast.error(errorMessage);
    return { success: false, error: errorMessage };
  }
  };

  const register = async (userData: RegisterData): Promise<{ success: boolean; needsConfirmation?: boolean; error?: string }> => {
    try {
      const response = await fetch(import.meta.env.VITE_API_URL + "/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: userData.firstName,
          lastName: userData.lastName,
          username: userData.username,
          email: userData.email,
          password: userData.password,
          birthday: userData.birthday,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = (data ? Object.values(data).join('\n')  : "Erreur lors de l'inscription");
        return { success: false, error: errorMessage };
      }

      toast.success("Inscription réussie ! Veuillez confirmer votre email.");
      return { success: true, needsConfirmation: true };
    } catch (error) {
      console.error("Erreur d'inscription:", error);
      return { success: false, error: "Erreur de connexion au serveur" };
    }
  };

  const confirmEmail = async (token: string): Promise<boolean> => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/verify/${token}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        toast.error(data.message || "Lien invalide ou expiré.");
        return false;
      }

      toast.success(data.message || "Email confirmé !");
      return true;
    } catch (error) {
      console.error("Erreur de confirmation email:", error);
      toast.error("Erreur lors de la confirmation.");
      return false;
    }
  };


  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch {}
    setUser(null);
    setIsLoggedIn(false);
    localStorage.removeItem('matcha_user');
    toast.info('Déconnexion réussie');
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      localStorage.setItem('matcha_user', JSON.stringify(updatedUser));
    }
  };

  const refreshUser = async () => {
    await updateUserFromCookie();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoggedIn,
        updateUser,
        refreshUser,
        confirmEmail,
        isLoadingUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
