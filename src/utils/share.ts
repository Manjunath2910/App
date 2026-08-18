// ─── Cross-platform share ─────────────────────────────────────────────────────
// Native (iOS/Android): opens the OS share sheet.
// Web: uses the browser Web Share API if available, otherwise copies the link.
import { Platform, Share } from 'react-native';

export async function shareStory(title: string, url: string): Promise<void> {
  const message = `${title}\n\nRead more: ${url}`;

  if (Platform.OS === 'web') {
    const g: any = globalThis as any;
    // 1) Native browser share (mobile browsers, installed PWAs)
    try {
      if (g.navigator?.share) {
        await g.navigator.share({ title, text: title, url });
        return;
      }
    } catch {
      return; // user dismissed the share sheet
    }
    // 2) Fallback: copy the link to the clipboard
    try {
      if (g.navigator?.clipboard?.writeText) {
        await g.navigator.clipboard.writeText(url);
        g.alert?.('Link copied to clipboard');
        return;
      }
    } catch {
      // ignore
    }
    // 3) Last resort: show the link so it can be copied manually
    try {
      g.prompt?.('Copy this link:', url);
    } catch {
      // ignore
    }
    return;
  }

  // Native share sheet
  try {
    await Share.share({ title, message, url }, { dialogTitle: 'Share this story' });
  } catch {
    // user dismissed or unsupported — ignore
  }
}
