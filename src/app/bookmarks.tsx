import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as WebBrowser from 'expo-web-browser';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { timeAgo } from '@/data/news';
import { useApp } from '@/store/app';

export default function Bookmarks() {
  const { palette, saved, toggleBookmark } = useApp();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top + 8 }]}>
      <Text style={[styles.h1, { color: palette.text }]}>Saved</Text>

      {saved.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="bookmark-outline" size={40} color={palette.textMuted} />
          <Text style={[styles.emptyTitle, { color: palette.text }]}>No saved stories yet</Text>
          <Text style={[styles.emptyText, { color: palette.textMuted }]}>
            Tap the bookmark icon on any card to save it here for later.
          </Text>
        </View>
      ) : (
        <FlatList
          data={saved}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16, gap: 12 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => WebBrowser.openBrowserAsync(item.url)}
              style={[styles.row, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.rowMeta, { color: palette.textMuted }]}>
                  {item.category} · {timeAgo(item.publishedAt)}
                </Text>
              </View>
              <Pressable hitSlop={10} onPress={() => toggleBookmark(item)}>
                <Ionicons name="bookmark" size={22} color={palette.accent} />
              </Pressable>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  h1: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5, paddingHorizontal: 20, marginBottom: 8 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '800', marginTop: 6 },
  emptyText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  row: {
    flexDirection: 'row',
    gap: 12,
    padding: 10,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  thumb: { width: 64, height: 64, borderRadius: 10, backgroundColor: '#0002' },
  rowTitle: { fontSize: 14.5, fontWeight: '700', lineHeight: 20 },
  rowMeta: { fontSize: 12, marginTop: 4 },
});
