// ─── CategoryMenu — Inshorts-style slide-in side menu (opens from hamburger) ───
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORIES, type Category } from '@/data/news';
import { useApp } from '@/store/app';

const CAT_COLOR: Record<string, string> = {
  All: '#E11D48',
  Blogs: '#A21563',
  Markets: '#16A34A',
  Digital: '#EC4899',
  'Social Media': '#E11D48',
  SEO: '#0EA5E9',
  Advertising: '#6366F1',
  Branding: '#10B981',
  AI: '#7C3AED',
  'E-commerce': '#F59E0B',
};

const CAT_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  All: 'newspaper-outline',
  Blogs: 'document-text-outline',
  Markets: 'trending-up-outline',
  Digital: 'globe-outline',
  'Social Media': 'chatbubbles-outline',
  SEO: 'search-outline',
  Advertising: 'megaphone-outline',
  Branding: 'color-palette-outline',
  AI: 'sparkles-outline',
  'E-commerce': 'cart-outline',
};

type Props = { visible: boolean; onClose: () => void };

export default function CategoryMenu({ visible, onClose }: Props) {
  const { palette, category, setCategory } = useApp();
  const insets = useSafeAreaInsets();

  const pick = (c: Category) => {
    setCategory(c);
    onClose();
  };

  const go = (path: string) => {
    onClose();
    router.navigate(path as never);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        {/* Panel */}
        <View style={[styles.panel, { backgroundColor: palette.card, paddingTop: insets.top + 18 }]}>
          {/* Brand header */}
          <View style={styles.header}>
            <View style={[styles.brandMark, { backgroundColor: palette.accent }]}>
              <Text style={styles.brandMarkText}>M</Text>
            </View>
            <View>
              <Text style={[styles.brand, { color: palette.text }]}>Mini Shorts</Text>
              <Text style={[styles.brandSub, { color: palette.textMuted }]}>Marketing news · 60-word reads</Text>
            </View>
          </View>

          <Text style={[styles.groupLabel, { color: palette.textFaint }]}>CATEGORIES</Text>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
            {CATEGORIES.map((c) => {
              const active = c === category;
              const color = CAT_COLOR[c] ?? palette.accent;
              return (
                <Pressable
                  key={c}
                  onPress={() => pick(c)}
                  style={[styles.row, active && { backgroundColor: palette.accentSoft }]}>
                  <View style={[styles.iconWrap, { backgroundColor: color + '22' }]}>
                    <Ionicons name={CAT_ICON[c] ?? 'ellipse-outline'} size={18} color={color} />
                  </View>
                  <Text style={[styles.rowText, { color: active ? palette.accent : palette.text }]}>{c}</Text>
                  {active && <Ionicons name="checkmark" size={18} color={palette.accent} style={{ marginLeft: 'auto' }} />}
                </Pressable>
              );
            })}

            <View style={[styles.divider, { backgroundColor: palette.border }]} />

            <Pressable onPress={() => go('/bookmarks')} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: palette.surfaceAlt }]}>
                <Ionicons name="bookmark-outline" size={18} color={palette.text} />
              </View>
              <Text style={[styles.rowText, { color: palette.text }]}>Saved</Text>
            </Pressable>
            <Pressable onPress={() => go('/discover')} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: palette.surfaceAlt }]}>
                <Ionicons name="compass-outline" size={18} color={palette.text} />
              </View>
              <Text style={[styles.rowText, { color: palette.text }]}>Discover</Text>
            </Pressable>
            <Pressable onPress={() => go('/settings')} style={styles.row}>
              <View style={[styles.iconWrap, { backgroundColor: palette.surfaceAlt }]}>
                <Ionicons name="settings-outline" size={18} color={palette.text} />
              </View>
              <Text style={[styles.rowText, { color: palette.text }]}>Settings</Text>
            </Pressable>
          </ScrollView>
        </View>

        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, flexDirection: 'row' },
  panel: { width: '78%', maxWidth: 340, paddingHorizontal: 16 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)' },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 6, paddingBottom: 20 },
  brandMark: { width: 40, height: 40, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontSize: 22, fontWeight: '800' },
  brand: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  brandSub: { fontSize: 11.5, marginTop: 2 },
  groupLabel: { fontSize: 11, fontWeight: '800', letterSpacing: 1, paddingHorizontal: 8, paddingBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 11, paddingHorizontal: 8, borderRadius: 12 },
  iconWrap: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  rowText: { fontSize: 15.5, fontWeight: '700' },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 10, marginHorizontal: 8 },
});
