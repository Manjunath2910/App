import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import PollCard from '@/components/PollCard';
import { ARTICLES, CATEGORIES, timeAgo, type Article, type Category } from '@/data/news';
import { POLLS } from '@/data/polls';
import { useApp } from '@/store/app';

const QUICK: { label: string; icon: keyof typeof Ionicons.glyphMap; cat: Category }[] = [
  { label: 'All News', icon: 'newspaper-outline', cat: 'All' },
  { label: 'AI', icon: 'sparkles-outline', cat: 'AI' },
  { label: 'Social', icon: 'chatbubbles-outline', cat: 'Social Media' },
  { label: 'Trending', icon: 'flame-outline', cat: 'Digital' },
];

export default function Discover() {
  const { palette, setCategory, openArticle, catalog } = useApp();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  // Search across everything the app has seen (blogs + live news + your posts),
  // falling back to the bundled list.
  const all = useMemo(() => {
    const seen = new Set<string>();
    return [...catalog, ...ARTICLES].filter((a) => (seen.has(a.id) ? false : seen.add(a.id)));
  }, [catalog]);

  const results = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return all.filter(
      (a) =>
        a.title.toLowerCase().includes(t) ||
        a.summary.toLowerCase().includes(t) ||
        (a.source || '').toLowerCase().includes(t) ||
        a.category.toLowerCase().includes(t) ||
        a.author.toLowerCase().includes(t),
    );
  }, [q, all]);

  const goCategory = (c: Category) => {
    setCategory(c);
    router.navigate('/');
  };

  const trending = ARTICLES.slice(0, 6);
  const latest = ARTICLES;

  const Row = ({ item }: { item: Article }) => (
    <Pressable onPress={() => openArticle(item)} style={[styles.row, { borderBottomColor: palette.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={[styles.rowMeta, { color: palette.textMuted }]}>
          {item.category} · {timeAgo(item.publishedAt)}
        </Text>
      </View>
      <Image source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" />
    </Pressable>
  );

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top + 6 }]}>
      {/* Search bar (fixed) */}
      <View style={styles.searchWrap}>
        <View style={[styles.search, { backgroundColor: palette.surfaceAlt }]}>
          <Ionicons name="search" size={18} color={palette.textMuted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Search for news, topics"
            placeholderTextColor={palette.textMuted}
            style={[styles.searchInput, { color: palette.text }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ('')} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={palette.textMuted} />
            </Pressable>
          )}
        </View>
      </View>

      {q.trim().length > 0 ? (
        /* ── Search results ── */
        <FlatList
          data={results}
          keyExtractor={(a) => a.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: palette.textMuted }]}>
              {results.length} result{results.length === 1 ? '' : 's'} for “{q.trim()}”
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={36} color={palette.textMuted} />
              <Text style={[styles.emptyText, { color: palette.textMuted }]}>
                No stories match “{q.trim()}”. Try another keyword like “AI”, “SEO” or “video”.
              </Text>
            </View>
          }
          renderItem={({ item }) => <Row item={item} />}
        />
      ) : (
        /* ── Browse ── */
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* Quick access */}
          <View style={styles.quickRow}>
            {QUICK.map((it) => (
              <Pressable key={it.label} onPress={() => goCategory(it.cat)} style={styles.quick}>
                <View style={[styles.quickIcon, { backgroundColor: palette.accentSoft }]}>
                  <Ionicons name={it.icon} size={22} color={palette.accent} />
                </View>
                <Text style={[styles.quickLabel, { color: palette.text }]}>{it.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Trending carousel */}
          <SectionHeader title="Trending now" palette={palette} />
          <FlatList
            horizontal
            data={trending}
            keyExtractor={(a) => a.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            renderItem={({ item }) => (
              <Pressable onPress={() => openArticle(item)} style={[styles.tall, { backgroundColor: palette.imgPlaceholder }]}>
                <Image source={{ uri: item.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                <LinearGradient colors={['transparent', 'rgba(0,0,0,0.85)']} style={styles.tallGrad} />
                <View style={[styles.tallChip, { backgroundColor: item.accent }]}>
                  <Text style={styles.tallChipText}>{item.category.toUpperCase()}</Text>
                </View>
                <Text style={styles.tallTitle} numberOfLines={3}>
                  {item.title}
                </Text>
              </Pressable>
            )}
          />

          {/* Poll */}
          <SectionHeader title="Poll of the day" palette={palette} />
          <FlatList
            horizontal
            data={POLLS}
            keyExtractor={(p) => p.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 14 }}
            renderItem={({ item }) => (
              <View style={{ width: 320 }}>
                <PollCard poll={item} />
              </View>
            )}
          />

          {/* Topics */}
          <SectionHeader title="Browse by topic" palette={palette} />
          <View style={styles.topicWrap}>
            {CATEGORIES.filter((c) => c !== 'All').map((c) => {
              const accent = ARTICLES.find((a) => a.category === c)?.accent ?? palette.accent;
              return (
                <Pressable key={c} onPress={() => goCategory(c)} style={[styles.topic, { backgroundColor: palette.card, borderColor: palette.border }]}>
                  <View style={[styles.topicDot, { backgroundColor: accent }]} />
                  <Text style={[styles.topicText, { color: palette.text }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>

          {/* Latest */}
          <SectionHeader title="Latest stories" palette={palette} />
          <View style={{ paddingHorizontal: 20 }}>
            {latest.map((item) => (
              <Row key={item.id} item={item} />
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function SectionHeader({ title, palette }: { title: string; palette: any }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      <View style={[styles.sectionRule, { backgroundColor: palette.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  searchWrap: { paddingHorizontal: 16, paddingBottom: 12 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, height: 46, borderRadius: 14 },
  searchInput: { flex: 1, fontSize: 15.5 },
  resultCount: { fontSize: 13, fontWeight: '600', paddingVertical: 12 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 30, gap: 12 },
  emptyText: { fontSize: 14.5, textAlign: 'center', lineHeight: 21 },
  quickRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 4, paddingBottom: 8 },
  quick: { alignItems: 'center', gap: 8, width: 74 },
  quickIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  quickLabel: { fontSize: 12.5, fontWeight: '700' },
  sectionHeader: { paddingHorizontal: 20, paddingTop: 22, paddingBottom: 12 },
  sectionTitle: { fontSize: 19, fontWeight: '800', letterSpacing: -0.4 },
  sectionRule: { width: 34, height: 3, borderRadius: 2, marginTop: 6 },
  tall: { width: 168, height: 232, borderRadius: 16, overflow: 'hidden' },
  tallGrad: { position: 'absolute', left: 0, right: 0, bottom: 0, height: '70%' },
  tallChip: { position: 'absolute', left: 10, top: 10, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tallChipText: { color: '#fff', fontSize: 9.5, fontWeight: '800', letterSpacing: 0.5 },
  tallTitle: { position: 'absolute', left: 12, right: 12, bottom: 12, color: '#fff', fontSize: 14.5, fontWeight: '800', lineHeight: 19 },
  topicWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, paddingHorizontal: 20 },
  topic: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, borderWidth: StyleSheet.hairlineWidth },
  topicDot: { width: 8, height: 8, borderRadius: 4 },
  topicText: { fontSize: 13.5, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowTitle: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  rowMeta: { fontSize: 12, marginTop: 5 },
  thumb: { width: 74, height: 74, borderRadius: 12, backgroundColor: '#0002' },
});
