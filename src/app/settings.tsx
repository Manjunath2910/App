import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { ThemeMode } from '@/constants/appTheme';
import { useApp } from '@/store/app';

const MODES: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: 'system', label: 'System', icon: 'phone-portrait-outline' },
  { key: 'light', label: 'Light', icon: 'sunny-outline' },
  { key: 'dark', label: 'Dark', icon: 'moon-outline' },
];

export default function Settings() {
  const { palette, mode, setMode, bookmarks } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top + 8 }]}>
      <Text style={[styles.h1, { color: palette.text }]}>Settings</Text>

      <Text style={[styles.section, { color: palette.textMuted }]}>APPEARANCE</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        {MODES.map((m, i) => {
          const active = mode === m.key;
          return (
            <Pressable
              key={m.key}
              onPress={() => setMode(m.key)}
              style={[styles.rowItem, i > 0 && { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
              <Ionicons name={m.icon} size={20} color={palette.text} />
              <Text style={[styles.rowLabel, { color: palette.text }]}>{m.label}</Text>
              {active && <Ionicons name="checkmark" size={20} color={palette.accent} />}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.section, { color: palette.textMuted }]}>ABOUT</Text>
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <View style={styles.rowItem}>
          <Ionicons name="bookmark-outline" size={20} color={palette.text} />
          <Text style={[styles.rowLabel, { color: palette.text }]}>Saved stories</Text>
          <Text style={{ color: palette.textMuted }}>{bookmarks.length}</Text>
        </View>
        <View style={[styles.rowItem, { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
          <Ionicons name="information-circle-outline" size={20} color={palette.text} />
          <Text style={[styles.rowLabel, { color: palette.text }]}>Version</Text>
          <Text style={{ color: palette.textMuted }}>1.0.0</Text>
        </View>
      </View>

      <Text style={[styles.footer, { color: palette.textMuted }]}>
        Mini Shorts — marketing news, summarised in 60 words.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  h1: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, paddingHorizontal: 20, marginBottom: 8 },
  section: { fontSize: 12, fontWeight: '800', letterSpacing: 0.8, paddingHorizontal: 20, marginTop: 18, marginBottom: 8 },
  card: { marginHorizontal: 16, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  rowItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  rowLabel: { fontSize: 15.5, fontWeight: '600', flex: 1 },
  footer: { fontSize: 12.5, textAlign: 'center', marginTop: 'auto', marginBottom: 24, paddingHorizontal: 24, lineHeight: 18 },
});
