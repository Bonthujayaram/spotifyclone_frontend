import { initializeApp } from 'firebase/app';
import {
  GoogleAuthProvider,
  OAuthProvider,
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';

// This config is NOT a secret. Google documents it as public client
// identification -- it ships inside the bundle no matter where you put it.
// Security comes from Firebase's Authorized Domains list and from the backend
// verifying every ID token before trusting it. Keeping it in source (rather
// than in VITE_ vars) means one less thing that can be forgotten at deploy
// time and silently break sign-in.
const firebaseConfig = {
  apiKey: 'AIzaSyAyjr_xqsg3eV-oBVz_8GL120nS3vOp9Xw',
  authDomain: 'spotify-clone-9b54a.firebaseapp.com',
  projectId: 'spotify-clone-9b54a',
  storageBucket: 'spotify-clone-9b54a.firebasestorage.app',
  messagingSenderId: '413608886481',
  appId: '1:413608886481:web:cf0c860d02a5715bd205f0',
  measurementId: 'G-W4XHEBN1C5',
};

// Analytics is deliberately not initialised -- it pulls a sizeable chunk into
// the auth path and this app does not read any of it.
export const auth = getAuth(initializeApp(firebaseConfig));

/** Signs in and returns a Firebase ID token for the backend to verify. */
export const firebaseEmailSignIn = async (email: string, password: string): Promise<string> => {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  return user.getIdToken();
};

export const firebaseEmailSignUp = async (
  email: string,
  password: string,
  name?: string,
): Promise<string> => {
  const { user } = await createUserWithEmailAndPassword(auth, email, password);
  if (name?.trim()) {
    await updateProfile(user, { displayName: name.trim() });
  }
  // Force a refresh so the token carries the display name we just set.
  return user.getIdToken(true);
};

export const firebaseGoogleSignIn = async (): Promise<string> => {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const { user } = await signInWithPopup(auth, provider);
  return user.getIdToken();
};

export const firebaseAppleSignIn = async (): Promise<string> => {
  const provider = new OAuthProvider('apple.com');
  provider.addScope('email');
  provider.addScope('name');
  const { user } = await signInWithPopup(auth, provider);
  return user.getIdToken();
};

/** Turns Firebase's error codes into something worth showing a person. */
export const firebaseErrorMessage = (error: unknown): string => {
  const code = (error as { code?: string })?.code ?? '';
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Incorrect email or password.';
    case 'auth/invalid-email':
      return 'That email address is not valid.';
    case 'auth/email-already-in-use':
      return 'An account with that email already exists. Try signing in.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a moment and try again.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return '';  // The user chose to close it; not worth a toast.
    case 'auth/popup-blocked':
      return 'Your browser blocked the sign-in popup. Allow popups and retry.';
    case 'auth/unauthorized-domain':
      return 'This domain is not authorised in Firebase. Add it under Authentication → Settings → Authorized domains.';
    case 'auth/operation-not-allowed':
      return 'That sign-in method is not enabled for this Firebase project.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    default:
      return error instanceof Error && error.message ? error.message : 'Sign-in failed. Please try again.';
  }
};
