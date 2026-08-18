import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryMenu from '@/components/CategoryMenu';
import NewsCard from '@/components/NewsCard';
import { ARTICLES, CATEGORIES, type Article } from '@/data/news';
import { MY_ARTICLES } from '@/data/myArticles';
import { fetchNews } from '@/data/remote';
import { useT } from '@/i18n';
import { useApp } from '@/store/app';

const shuffle = (arr: Article[]) => [...arr].sort(() => Math.random() - 0.5);
const TABS = ['My Feed', ...CATEGORIES]; // My Feed = your interests, then All + categories

export default function Feed() {
  const { palette, category, setCategory, isDark, setMode, interests } = useApp();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [h, setH] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [live, setLive] = useState<Article[] | null>(null); // live backend articles
  const [seed, setSeed] = useState(0); // reshuffle trigger for the offline fallback
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<string>('My Feed');
  const didMount = useRef(false);
  const listRef = useRef<FlatList<Article>>(null);

  // Load live news on mount; mix in your own stories so refresh can reshuffle all.
  useEffect(() => {
    fetchNews().then((a) => {
      if (a.length) setLive([...MY_ARTICLES, ...a]);
    });
  }, []);

  // When another screen changes the category (menu / discover), follow it.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setTab(category);
  }, [category]);

  const data = useMemo(() => {
    const src = live ?? (seed > 0 ? shuffle(ARTICLES) : ARTICLES);
    if (tab === 'My Feed') return interests.length ? src.filter((a) => interests.includes(a.category)) : src;
    if (tab === 'All') return src;
    return src.filter((a) => a.category === tab);
  }, [live, seed, tab, interests]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [tab]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    const a = await fetchNews();
    // Always reshuffle everything so a genuinely new story lands on top — works
    // whether or not the fetch returned anything new.
    setLive((prev) => shuffle(a.length ? [...MY_ARTICLES, ...a] : (prev ?? ARTICLES)));
    setSeed((s) => s + 1);
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    setRefreshing(false);
  }, []);

  // Endless feed: as you scroll down, keep appending fresh stories. New ones
  // from the live source come first; when exhausted we append a reshuffled
  // batch so the feed never dead-ends.
  const onEndReached = useCallback(async () => {
    if (loadingMore) return;
    setLoadingMore(true);
    const a = await fetchNews();
    const pool = a.length ? a : ARTICLES;
    setLive((prev) => {
      const base = prev ?? [];
      const seen = new Set(base.map((x) => x.id));
      const fresh = pool.filter((x) => !seen.has(x.id));
      const toAdd = fresh.length ? fresh : shuffle(pool).map((x) => ({ ...x, id: `${x.id}-${base.length}` }));
      return [...base, ...toAdd];
    });
    setLoadingMore(false);
  }, [loadingMore]);

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      {/* ── Top bar (Inshorts-style: menu · centered wordmark · search) ── */}
      <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
        <Pressable onPress={() => setMenuOpen(true)} hitSlop={8} style={styles.edgeBtn}>
          <Ionicons name="menu" size={24} color={palette.text} />
        </Pressable>

        <View style={styles.brandCenter} pointerEvents="none">
          <View style={[styles.brandMark, { backgroundColor: palette.accent }]}>
            <Text style={styles.brandMarkText}>M</Text>
          </View>
          <Text style={[styles.brand, { color: palette.text }]}>Mini Shorts</Text>
          {live && <View style={styles.liveDot} />}
        </View>

        <View style={styles.rightActions}>
          <Pressable onPress={() => setMode(isDark ? 'light' : 'dark')} hitSlop={8} style={styles.edgeBtn}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={palette.text} />
          </Pressable>
          <Pressable onPress={onRefresh} disabled={refreshing} hitSlop={8} style={styles.edgeBtn}>
            {refreshing ? (
              <ActivityIndicator size="small" color={palette.accent} />
            ) : (
              <Ionicons name="refresh" size={21} color={palette.text} />
            )}
          </Pressable>
          <Pressable onPress={() => router.navigate('/discover')} hitSlop={8} style={styles.edgeBtn}>
            <Ionicons name="search" size={21} color={palette.text} />
          </Pressable>
        </View>
      </View>

      {/* ── Category strip ── */}
      <View style={styles.stripWrap}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {TABS.map((c) => {
            const active = c === tab;
            const label = c === 'My Feed' ? t('myFeed') : c;
            return (
              <Pressable
                key={c}
                onPress={() => {
                  setTab(c);
                  if (c !== 'My Feed') setCategory(c as never);
                }}
                style={[
                  styles.chip,
                  active
                    ? { backgroundColor: palette.accent }
                    : { backgroundColor: palette.chipBg, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth },
                ]}>
                <Text style={[styles.chipText, { color: active ? palette.accentText : palette.chipText }]}>{label}</Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Paging feed (pull down or tap ↻ to refresh) ── */}
      <View style={styles.feed} onLayout={(e) => setH(Math.round(e.nativeEvent.layout.height))}>
        {h > 0 && (
          <FlatList
            ref={listRef}
            key={tab}
            data={data}
            keyExtractor={(a) => a.id}
            renderItem={({ item }) => <NewsCard article={item} height={h} />}
            pagingEnabled
            snapToInterval={h}
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: h, offset: h * index, index })}
            windowSize={5}
            maxToRenderPerBatch={3}
            initialNumToRender={2}
            onEndReached={onEndReached}
            onEndReachedThreshold={1.2}
            ListEmptyComponent={
              <View style={[styles.empty, { height: h }]}>
                <Text style={{ color: palette.textMuted }}>{t('emptyCategory')}</Text>
              </View>
            }
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={palette.accent}
                colors={[palette.accent]}
                progressBackgroundColor={palette.card}
                title={t('loadingLatest')}
                titleColor={palette.textMuted}
              />
            }
          />
        )}
      </View>

      <CategoryMenu visible={menuOpen} onClose={() => setMenuOpen(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  edgeBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  rightActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  brandCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 8,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  brandMark: { width: 26, height: 26, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: '#fff', fontSize: 15, fontWeight: '800' },
  brand: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#22C55E', marginLeft: 2 },
  stripWrap: { paddingVertical: 10 },
  strip: { paddingHorizontal: 16, gap: 8 },
  chip: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '700' },
  feed: { flex: 1 },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
});
