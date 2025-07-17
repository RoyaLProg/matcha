import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/components/ui/sonner';
import { jwtDecode } from 'jwt-decode';
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
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: RegisterData) => Promise<{ success: boolean; needsConfirmation?: boolean; error?: string }>;
  logout: () => void;
  isLoggedIn: boolean;
  updateUser: (userData: Partial<User>) => void;
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

function getCookie(name: string): string | undefined {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : undefined;
}

function clearAuthCookie() {
  document.cookie = 'Auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}




export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

async function updateUserFromCookie(): Promise<User | null> {
  if (typeof document === 'undefined') return null;

  const token = getCookie('Auth');
  if (!token) {
    setUser(null);
    setIsLoggedIn(false);
    setIsLoadingUser(false); // 👈 ici
    return null;
  }

  try {
    const decoded: any = jwtDecode(token);
    const isExpired = decoded?.exp && decoded.exp * 1000 < Date.now();
    if (isExpired) {
      clearAuthCookie();
      setUser(null);
      setIsLoggedIn(false);
      setIsLoadingUser(false); // 👈 ici aussi
      return null;
    }

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/users/me`, {
      method: 'GET',
      credentials: 'include',
    });

    if (!res.ok) {
      clearAuthCookie();
      setUser(null);
      setIsLoggedIn(false);
      setIsLoadingUser(false); // 👈 encore ici
      return null;
    }

    const u = await res.json();
    let complete = false;
    if (u?.settings)
      complete = true;
    const user = { ...u, profileCompleted: complete };
    setUser(user);
    setIsLoggedIn(true);
    setIsLoadingUser(false); // 👈 et ici
    return user;

  } catch (err) {
    console.error("Erreur updateUserFromCookie:", err);
    setUser(null);
    setIsLoggedIn(false);
    setIsLoadingUser(false); // 👈 dernière fois
    return null

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


  const login = async (username: string, password: string): Promise<boolean> => {
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
      toast.error(data.message || "Erreur de connexion");
      return false;
    }

    // Appelle ta fonction de mise à jour du contexte utilisateur si elle existe
    const user = await updateUserFromCookie();
    if (user) {
      console.log("✅ Utilisateur à jour immédiatement :", user);
    }

    toast.success("Connexion réussie !");
    return true;
  } catch (error) {
    console.error("Erreur lors du login :", error);
    toast.error("Erreur réseau lors de la connexion");
    return false;
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
        const errorMessage = data?.other || data?.message || "Erreur lors de l'inscription";
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


  const logout = () => {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isLoggedIn,
        updateUser,
        confirmEmail,
        isLoadingUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};