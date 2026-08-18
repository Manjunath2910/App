// ─── App config ───────────────────────────────────────────────────────────────
import Constants from 'expo-constants';

// The news backend runs on your computer at this port (see /server).
const API_PORT = 4000;

// On a phone via Expo Go we reach the backend through the same host that serves
// the Expo bundle (your computer's LAN IP); on web this is localhost.
function resolveApiBase(): string {
  const hostUri = Constants.expoConfig?.hostUri || (Constants as any)?.manifest2?.extra?.expoGo?.debuggerHost;
  const host = typeof hostUri === 'string' ? hostUri.split(':')[0] : undefined;
  return `http://${host || 'localhost'}:${API_PORT}`;
}

export const API_URL = resolveApiBase();
