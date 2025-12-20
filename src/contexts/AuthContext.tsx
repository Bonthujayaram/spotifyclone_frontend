import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '@/lib/authApi';

interface ExternalArtist {
  platform: string;
  id: string;
  name: string;
  handle: string;
  profilePicture: {
    '150x150'?: string;
    '480x480'?: string;
    '1000x1000'?: string;
  };
  followedAt: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  profilePicture?: string;
  following: string[];
  externalFollowing: ExternalArtist[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await authApi.getCurrentUser(token);
          // Ensure user data has all required fields
          const completeUser: User = {
            ...userData,
            following: userData.following || [],
            externalFollowing: userData.externalFollowing || []
          };
          setUser(completeUser);
        } catch (error) {
          console.error('Failed to get user data:', error);
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const { token, user: userData } = await authApi.login({ email, password });
      // Ensure user data has all required fields
      const completeUser: User = {
        ...userData,
        following: userData.following || [],
        externalFollowing: userData.externalFollowing || []
      };
      setUser(completeUser);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(completeUser));
      navigate('/'); // Redirect to home page after login
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    try {
      const { token, user: userData } = await authApi.signup({ email, password, name });
      // Ensure user data has all required fields
      const completeUser: User = {
        ...userData,
        following: userData.following || [],
        externalFollowing: userData.externalFollowing || []
      };
      setUser(completeUser);
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(completeUser));
      navigate('/'); // Redirect to home page after signup
    } catch (error) {
      console.error('Signup failed:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAuthenticated: !!user,
      login,
      signup,
      logout,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext; 