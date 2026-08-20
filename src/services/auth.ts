// ─── Real auth (Firebase) — Google + Phone OTP ───────────────────────────────
// Native only. On web (Expo preview) these throw a friendly error and SignIn.tsx
// falls back to the demo flow so you can still click through the UI at :8081.
// Real logins run on the device dev build.
import { Platform } from 'react-native';
import { GOOGLE_WEB_CLIENT_ID } from './firebaseConfig';

// Lazy native imports so the web bundle / tsc never touches the native modules.
let authMod: any = null;
let GoogleSignin: any = null;
let configured = false;

function ensureNative(): boolean {
  if (Platform.OS === 'web') return false;
  if (!authMod || !GoogleSignin) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      authMod = require('@react-native-firebase/auth').default;
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      GoogleSignin = require('@react-native-google-signin/google-signin').GoogleSignin;
    } catch {
      return false;
    }
  }
  if (!configured && GoogleSignin && GOOGLE_WEB_CLIENT_ID) {
    try {
      GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });
      configured = true;
    } catch {
      // ignore
    }
  }
  return !!authMod && !!GoogleSignin;
}

export function authReady(): boolean {
  return ensureNative();
}

export type AuthUser = { name: string; email: string };

// ── Google ───────────────────────────────────────────────────────────────────
export async function signInWithGoogle(): Promise<AuthUser> {
  if (!ensureNative()) {
    throw new Error('web-preview');
  }
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const res = await GoogleSignin.signIn();
  const idToken = res?.data?.idToken ?? res?.idToken;
  if (!idToken) throw new Error('Google sign-in returned no token. Check the SHA-1 in Firebase.');
  const credential = authMod.GoogleAuthProvider.credential(idToken);
  const userCred = await authMod().signInWithCredential(credential);
  const u = userCred.user;
  return { name: u.displayName || 'Google user', email: u.email || '' };
}

// ── Facebook ──────────────────────────────────────────────────────────────────
// Real Facebook login is enabled once your Facebook App ID is configured
// (adds react-native-fbsdk-next + native config). Until then this throws
// 'not-configured' so the button shows a friendly message instead of faking a login.
export async function signInWithFacebook(): Promise<AuthUser> {
  if (!ensureNative()) throw new Error('web-preview');
  throw new Error('not-configured');
}

// ── Phone OTP ─────────────────────────────────────────────────────────────────
// Returns a confirmation object; pass it to confirmOtp() with the typed code.
export async function sendOtp(phoneE164: string): Promise<any> {
  if (!ensureNative()) {
    throw new Error('web-preview');
  }
  return authMod().signInWithPhoneNumber(phoneE164);
}

export async function confirmOtp(confirmation: any, code: string): Promise<AuthUser> {
  const userCred = await confirmation.confirm(code);
  const u = userCred.user;
  return { name: u.phoneNumber || 'Phone user', email: '' };
}

// ── Sign out (best effort) ────────────────────────────────────────────────────
export async function signOutAll(): Promise<void> {
  try {
    if (GoogleSignin) await GoogleSignin.signOut();
  } catch {
    // ignore
  }
  try {
    if (authMod) await authMod().signOut();
  } catch {
    // ignore
  }
}
