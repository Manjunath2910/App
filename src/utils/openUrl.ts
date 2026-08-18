// ─── Cross-platform "open a link" ─────────────────────────────────────────────
// Native: opens an in-app browser. Web: opens the URL in a new tab.
import * as WebBrowser from 'expo-web-browser';
import { Platform } from 'react-native';

export async function openUrl(url: string): Promise<void> {
  if (!url) return;
  if (Platform.OS === 'web') {
    try {
      (globalThis as any).open?.(url, '_blank', 'noopener,noreferrer');
    } catch {
      // ignore
    }
    return;
  }
  try {
    await WebBrowser.openBrowserAsync(url);
  } catch {
    // ignore
  }
}
