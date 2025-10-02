import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/sonner';
interface User {
  id: string;
  email: string;
  username: string;
  firstName: string;
  lastName: string;
  birthday?: string;
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

async function updateUserFromCookie(): Promise<User | null> {

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    });
    if (!res.ok) {
      setUser(null);
      setIsLoggedIn(false);
      setIsLoadingUser(false);
      return null;
    }
    const u = await res.json();
    const user = { ...u, profileCompleted: !!u?.settings };
    setUser(user);
    setIsLoggedIn(true);
    setIsLoadingUser(false);
    return user;
  } catch (err) {
    console.error('Erreur updateUserFromCookie:', err);
    setUser(null);
    setIsLoggedIn(false);
    setIsLoadingUser(false);
    return null;
  }
}


useEffect(() => {

    const init = async () => {
      const user = await updateUserFromCookie();

      setIsLoadingUser(false);
    };
    init();

}, []);





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
