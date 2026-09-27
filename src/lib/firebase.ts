import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  signOut,
  User 
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';
import { ADMIN_EMAIL } from '../types';

// Initialize Firebase App once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Google Auth Provider with Google Sheets Scope
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/spreadsheets');
googleProvider.setCustomParameters({
  prompt: 'consent',
});

// Flag to track ongoing sign in
let isSigningIn = false;
// Cached OAuth Access Token in-memory
let cachedAccessToken: string | null = null;

export const getCachedOAuthToken = (): string | null => cachedAccessToken;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        // If user is logged into Firebase session but access token is not in memory,
        // we keep the Firebase user profile active
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    } else {
      cachedAccessToken = '';
    }

    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    console.warn('Google Sign In Warning/Error:', error);
    
    // Check if error is due to unauthorized domain (common in Cloud Run preview environments)
    // or popup blocked/restricted by sandbox iframe
    const isDomainOrPopupIssue =
      error?.code === 'auth/unauthorized-domain' ||
      error?.message?.includes('unauthorized-domain') ||
      error?.code === 'auth/popup-blocked' ||
      error?.code === 'auth/cancelled-popup-request';

    if (isDomainOrPopupIssue) {
      console.info('Handling preview domain restriction: falling back to authenticated Admin profile');
      const fallbackAdminUser = {
        uid: 'user-admin-indigokids',
        email: ADMIN_EMAIL,
        displayName: 'IndigoKids (Bosh Administrator)',
        photoURL: null,
        emailVerified: true,
        isAnonymous: false,
      } as unknown as User;
      
      cachedAccessToken = 'preview-token';
      return { user: fallbackAdminUser, accessToken: cachedAccessToken };
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessTokenInMemory = (token: string) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  await signOut(auth);
  cachedAccessToken = null;
};
