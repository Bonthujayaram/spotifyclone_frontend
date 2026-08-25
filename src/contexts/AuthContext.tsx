import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi, type UserSettings } from '@/lib/authApi';
import {
  auth as firebaseAuth,
  firebaseAppleSignIn,
  firebaseEmailSignIn,
  firebaseEmailSignUp,
  firebaseGoogleSignIn,
} from '@/lib/firebase';
import { signOut as firebaseSignOut } from 'firebase/auth';

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
  isGoogleUser?: boolean;
  following: string[];
  externalFollowing: ExternalArtist[];
  settings?: UserSettings;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEFAULT_SETTINGS: UserSettings = {
  audioQuality: 'auto',
  autoplay: true,
  accountPrivacy: 'friends',
  notifications: 'push_email',
  connectedAccounts: {
    google: false,
  },
};

/** Raw /auth payload: identity fields are always present, the rest may not be. */
type RawUser = Pick<User, 'id' | 'email' | 'name'> & Partial<User>;

const normalizeUser = (userData: RawUser): User => ({
  ...userData,
  following: userData.following || [],
  externalFollowing: userData.externalFollowing || [],
  settings: {
    ...DEFAULT_SETTINGS,
    ...(userData.settings || {}),
    connectedAccounts: {
      ...DEFAULT_SETTINGS.connectedAccounts,
      ...(userData.settings?.connectedAccounts || {}),
      google: Boolean(userData.settings?.connectedAccounts?.google || userData.isGoogleUser),
    },
  },
});

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
          const completeUser = normalizeUser(userData);
          setUser(completeUser);
          localStorage.setItem('user', JSON.stringify(completeUser));
          localStorage.setItem('audio_quality', completeUser.settings?.audioQuality || 'auto');
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

  // Firebase authenticates; the backend verifies the ID token and returns this
  // app's JWT. Every other request keeps using that JWT exactly as before.
  const completeSignIn = async (idToken: string) => {
    const { token, user: userData } = await authApi.firebaseSignIn(idToken);
    const completeUser = normalizeUser(userData);
    setUser(completeUser);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(completeUser));
    localStorage.setItem('audio_quality', completeUser.settings?.audioQuality || 'auto');
    navigate('/');
  };

  const login = async (email: string, password: string) => {
    await completeSignIn(await firebaseEmailSignIn(email, password));
  };

  const signup = async (email: string, password: string, name?: string) => {
    await completeSignIn(await firebaseEmailSignUp(email, password, name));
  };

  const loginWithGoogle = async () => {
    await completeSignIn(await firebaseGoogleSignIn());
  };

  const loginWithApple = async () => {
    await completeSignIn(await firebaseAppleSignIn());
  };

  const logout = () => {
    // Clear the Firebase session too, or the next visit silently resumes it.
    firebaseSignOut(firebaseAuth).catch((error) =>
      console.warn('Firebase sign-out failed:', error),
    );
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
      loginWithGoogle,
      loginWithApple,
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
