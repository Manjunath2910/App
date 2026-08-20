import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryMenu from '@/components/CategoryMenu';
import ComposeArticle from '@/components/ComposeArticle';
import NewsCard from '@/components/NewsCard';
import { ARTICLES, type Article } from '@/data/news';
import { MY_ARTICLES } from '@/data/myArticles';
import { fetchBlogs } from '@/data/blogs';
import { fetchNews } from '@/data/remote';
import { useT } from '@/i18n';
import { useApp } from '@/store/app';

const shuffle = (arr: Article[]) => [...arr].sort(() => Math.random() - 0.5);
// Rotate an array left by n (stable + deterministic) so refresh leads with a new item.
const rotate = (arr: Article[], n: number) => {
  const len = arr.length;
  if (!len) return arr;
  const k = ((n % len) + len) % len;
  return [...arr.slice(k), ...arr.slice(0, k)];
};

// Inshorts-style top strip. Some tabs filter the feed; a couple open other screens.
type StripTab = { key: string; label: string; kind: 'feed' | 'all' | 'videos' | 'cat' | 'marketing' | 'rates'; route?: string };

// Animated FlatList so each card can fade + scale as it swipes into view.
const AList: any = Animated.FlatList;

export default function Feed() {
  const { palette, category, setCategory, isDark, setMode, interests, myPosts } = useApp();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [h, setH] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [live, setLive] = useState<Article[] | null>(null); // live backend articles
  const [blogs, setBlogs] = useState<Article[]>([]); // ZoltMoney blog posts
  const [seed, setSeed] = useState(0); // reshuffle trigger for the offline fallback
  const [loadingMore, setLoadingMore] = useState(false);
  const [tab, setTab] = useState<string>('My Feed');
  const didMount = useRef(false);
  const listRef = useRef<FlatList<Article>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const refreshingRef = useRef(false);
  // Custom pull-to-refresh (works on web too, where RN's RefreshControl doesn't).
  const atTopRef = useRef(true);
  const startYRef = useRef(0);
  const pullRef = useRef(0);
  const [pull, setPull] = useState(0);
  const setPullVal = (v: number) => {
    pullRef.current = v;
    setPull(v);
  };
  const touchY = (e: any) => {
    const ne = e?.nativeEvent ?? {};
    if (ne.touches?.length) return ne.touches[0].clientY ?? ne.touches[0].pageY ?? 0;
    if (ne.changedTouches?.length) return ne.changedTouches[0].clientY ?? ne.changedTouches[0].pageY ?? 0;
    return ne.pageY ?? 0;
  };
  const onTouchStart = (e: any) => {
    startYRef.current = touchY(e);
  };
  const onTouchMove = (e: any) => {
    if (refreshingRef.current || !atTopRef.current) return;
    const dy = touchY(e) - startYRef.current;
    if (dy > 0) setPullVal(Math.min(dy * 0.55, 90));
  };
  const onTouchEnd = () => {
    if (pullRef.current >= 55 && !refreshingRef.current) onRefresh();
    setPullVal(0);
  };

  // Load live news + ZoltMoney blogs on mount.
  useEffect(() => {
    fetchNews().then((a) => {
      if (a.length) setLive([...MY_ARTICLES, ...a]);
    });
    fetchBlogs().then((b) => b.length && setBlogs(b));
  }, []);

  // When another screen changes the category (menu / discover), follow it.
  useEffect(() => {
    if (!didMount.current) {
      didMount.current = true;
      return;
    }
    setTab(category);
  }, [category]);

  // Top strip: section tabs.
  const strip: StripTab[] = useMemo(
    () => [
      { key: 'My Feed', label: t('myFeed'), kind: 'feed' },
      { key: 'Marketing News', label: 'Marketing News', kind: 'marketing' },
      { key: 'Rate News', label: 'Rate News', kind: 'rates' },
      { key: 'Finance', label: 'Finance', kind: 'rates' },
      { key: 'Daily', label: t('daily'), kind: 'cat', route: '/daily' },
      { key: 'Insight', label: t('insights'), kind: 'cat', route: '/insights' },
      { key: 'Videos', label: 'Videos', kind: 'videos' },
    ],
    [t],
  );

  const data = useMemo(() => {
    // Blogs + live/bundled news. On refresh (seed++), rotate so a *different*
    // story leads each time — this is what makes new news appear on pull-down.
    const body = [...blogs, ...(live ?? ARTICLES)];
    const rotated = seed > 0 && body.length ? rotate(body, seed) : body;
    // Your own posts stay pinned on top, then the rotated feed.
    const src = [...myPosts, ...rotated];
    // My Feed = ZoltMoney blogs + your articles + all marketing news.
    if (tab === 'My Feed') return src;
    if (tab === 'All') return src;
    if (tab === 'Videos') return src.filter((a) => a.videoUrl);
    if (tab === 'Marketing News') return src.filter((a) => a.category !== 'Markets' && a.category !== 'Blogs');
    if (tab === 'Rate News' || tab === 'Finance') return src.filter((a) => a.category === 'Markets');
    return src.filter((a) => a.category === tab);
  }, [live, blogs, seed, tab, interests, myPosts]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [tab]);

  const onRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      fetchBlogs().then((b) => b.length && setBlogs(b)); // refresh blogs too
      const a = await fetchNews();
      // Always reshuffle everything so a genuinely new story lands on top — works
      // whether or not the fetch returned anything new.
      setLive((prev) => shuffle(a.length ? [...MY_ARTICLES, ...a] : (prev ?? ARTICLES)));
      setSeed((s) => s + 1);
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } finally {
      setRefreshing(false);
      refreshingRef.current = false;
    }
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
          <Pressable onPress={() => setComposeOpen(true)} hitSlop={8} style={styles.edgeBtn}>
            <Ionicons name="create-outline" size={21} color={palette.text} />
          </Pressable>
          <Pressable onPress={() => setMode(isDark ? 'light' : 'dark')} hitSlop={8} style={styles.edgeBtn}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={palette.text} />
          </Pressable>
        </View>
      </View>

      {/* ── Top text tabs (My Feed · Daily · Finance · Videos · Timelines · …) ── */}
      <View style={[styles.stripWrap, { borderBottomColor: palette.border }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.strip}>
          {strip.map((item) => {
            const active = !item.route && tab === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => {
                  if (item.route) {
                    router.navigate(item.route as never);
                    return;
                  }
                  setTab(item.key);
                  if (item.key === 'Finance') setCategory('Markets' as never);
                  else if (item.kind === 'cat') setCategory(item.key as never);
                }}
                style={styles.tab}>
                <Text style={[styles.tabText, { color: active ? palette.accent : palette.textMuted }]}>{item.label}</Text>
                <View style={[styles.tabInd, active && { backgroundColor: palette.accent }]} />
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Paging feed (pull down to refresh) ── */}
      <View
        style={[styles.feed, Platform.OS === 'web' ? ({ overscrollBehaviorY: 'contain' } as any) : null]}
        onLayout={(e) => setH(Math.round(e.nativeEvent.layout.height))}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        onTouchCancel={onTouchEnd}>
        {/* Pull spinner (shows while pulling or refreshing) */}
        {(pull > 0 || refreshing) && (
          <View pointerEvents="none" style={[styles.pullSpinner, { top: (refreshing ? 46 : pull) - 30 }]}>
            <View style={[styles.pullDot, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <ActivityIndicator size="small" color={palette.accent} />
            </View>
          </View>
        )}
        {h > 0 && (
          <AList
            ref={listRef}
            key={tab}
            data={data}
            keyExtractor={(a: Article) => a.id}
            renderItem={({ item, index }: { item: Article; index: number }) => {
              const inputRange = [(index - 1) * h, index * h, (index + 1) * h];
              // Slide transition: the next card slides up into place; the leaving
              // card eases up and dims — a clean, professional hand-off.
              const translateY = scrollY.interpolate({
                inputRange,
                outputRange: [h * 0.28, 0, -h * 0.14],
                extrapolate: 'clamp',
              });
              const opacity = scrollY.interpolate({
                inputRange,
                outputRange: [0.25, 1, 0.4],
                extrapolate: 'clamp',
              });
              return (
                <Animated.View style={{ height: h, opacity, transform: [{ translateY }] }}>
                  <NewsCard article={item} height={h} />
                </Animated.View>
              );
            }}
            pagingEnabled
            snapToInterval={h}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            showsVerticalScrollIndicator={false}
            getItemLayout={(_: unknown, index: number) => ({ length: h, offset: h * index, index })}
            onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
              useNativeDriver: true,
              // Pull the top card down past ~80px to trigger a refresh (works even
              // when the paging snap eats the native RefreshControl gesture).
              listener: (e: any) => {
                const y = e?.nativeEvent?.contentOffset?.y ?? 0;
                atTopRef.current = y <= 2;
                if (y < -80 && !refreshingRef.current) onRefresh();
              },
            })}
            bounces
            alwaysBounceVertical
            scrollEventThrottle={16}
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
      <ComposeArticle visible={composeOpen} onClose={() => setComposeOpen(false)} />
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
  stripWrap: { borderBottomWidth: StyleSheet.hairlineWidth },
  strip: { paddingHorizontal: 12, alignItems: 'flex-end' },
  tab: { paddingHorizontal: 12, paddingTop: 12, alignItems: 'center' },
  tabText: { fontSize: 14.5, fontWeight: '800', letterSpacing: -0.2 },
  tabInd: { height: 3, alignSelf: 'stretch', borderRadius: 2, marginTop: 9, backgroundColor: 'transparent' },
  feed: { flex: 1 },
  pullSpinner: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 20 },
  pullDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  empty: { alignItems: 'center', justifyContent: 'center', padding: 40 },
});
