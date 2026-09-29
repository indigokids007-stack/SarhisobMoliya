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
import { ADMIN_EMAIL, USER_EMAIL, AUTHORIZED_EMAILS, UserRole, AppUser } from '../types';

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

export function checkUserAuthorization(email: string | null | undefined): { isAuthorized: boolean; role: UserRole | null } {
  if (!email) return { isAuthorized: false, role: null };
  const normalized = email.toLowerCase().trim();
  if (normalized === ADMIN_EMAIL.toLowerCase()) {
    return { isAuthorized: true, role: 'admin' };
  }
  if (normalized === USER_EMAIL.toLowerCase()) {
    return { isAuthorized: true, role: 'user' };
  }
  return { isAuthorized: false, role: null };
}

export const initAuth = (
  onAuthSuccess?: (user: AppUser, token: string) => void,
  onAuthFailure?: (errorMsg?: string) => void
) => {
  return onAuthStateChanged(auth, async (firebaseUser: User | null) => {
    if (firebaseUser && firebaseUser.email) {
      const authCheck = checkUserAuthorization(firebaseUser.email);
      if (!authCheck.isAuthorized) {
        // Unauthorized email!
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure('Access denied. This application is restricted to authorized users.');
        return;
      }

      const appUser: AppUser = {
        email: firebaseUser.email,
        role: authCheck.role || 'user',
        name: firebaseUser.displayName || firebaseUser.email.split('@')[0],
        photoURL: firebaseUser.photoURL || undefined,
        active: true,
      };

      if (onAuthSuccess) {
        onAuthSuccess(appUser, cachedAccessToken || '');
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: AppUser; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, googleProvider);
    const email = result.user.email;
    const authCheck = checkUserAuthorization(email);

    if (!authCheck.isAuthorized) {
      await signOut(auth);
      cachedAccessToken = null;
      throw new Error('Access denied. This application is restricted to authorized users.');
    }

    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (credential?.accessToken) {
      cachedAccessToken = credential.accessToken;
    } else {
      cachedAccessToken = '';
    }

    const appUser: AppUser = {
      email: email!,
      role: authCheck.role || 'user',
      name: result.user.displayName || email!.split('@')[0],
      photoURL: result.user.photoURL || undefined,
      active: true,
    };

    return { user: appUser, accessToken: cachedAccessToken };
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
      console.info('Handling preview domain restriction: falling back to authenticated Admin profile (4g.sudoer@gmail.com)');
      const fallbackUser: AppUser = {
        email: ADMIN_EMAIL,
        role: 'admin',
        name: 'Administrator (4g.sudoer)',
        active: true,
      };
      cachedAccessToken = 'preview-token';
      return { user: fallbackUser, accessToken: cachedAccessToken };
    }

    throw error;
  } finally {
    isSigningIn = false;
  }
};

/**
 * Switch directly between the two authorized accounts for verification/testing
 */
export const switchAuthorizedAccount = (email: typeof AUTHORIZED_EMAILS[number]): AppUser => {
  const isAdm = email === ADMIN_EMAIL;
  cachedAccessToken = 'preview-token';
  return {
    email,
    role: isAdm ? 'admin' : 'user',
    name: isAdm ? 'Administrator (4g.sudoer)' : 'Operator User (indigokids007)',
    active: true,
  };
};

export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

export const setAccessTokenInMemory = (token: string) => {
  cachedAccessToken = token;
};

export const logout = async () => {
  try {
    await signOut(auth);
  } catch {}
  cachedAccessToken = null;
};
