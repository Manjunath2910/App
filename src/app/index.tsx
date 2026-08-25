import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useNavigation } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Animated, FlatList, Modal, Platform, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CategoryMenu from '@/components/CategoryMenu';
import NewsCard from '@/components/NewsCard';
import { ARTICLES, timeAgo, type Article } from '@/data/news';
import { MY_ARTICLES } from '@/data/myArticles';
import { fetchBlogs, fetchBlogsFast, loadCachedBlogs } from '@/data/blogs';
import { fetchNews } from '@/data/remote';
import { useT } from '@/i18n';
import { useApp } from '@/store/app';

const shuffle = (arr: Article[]) => [...arr].sort(() => Math.random() - 0.5);
// Rotate left by n (stable + deterministic): appended items stay at the end, so
// the feed doesn't reorder while scrolling — but each refresh leads with a
// different (still recent) story.
const rotate = (arr: Article[], n: number) => {
  const len = arr.length;
  if (!len) return arr;
  const k = ((n % len) + len) % len;
  return [...arr.slice(k), ...arr.slice(0, k)];
};
// Newest-first by publish date (missing dates sort last).
const byNewest = (arr: Article[]) =>
  [...arr].sort((a, b) => {
    const ta = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const tb = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return tb - ta;
  });
// Interleave two lists with a weighting (na from a, then nb from b, repeat).
const interleave = (a: Article[], b: Article[], na: number, nb: number) => {
  const out: Article[] = [];
  let i = 0;
  let j = 0;
  while (i < a.length || j < b.length) {
    for (let k = 0; k < na && i < a.length; k++) out.push(a[i++]);
    for (let k = 0; k < nb && j < b.length; k++) out.push(b[j++]);
  }
  return out;
};

// Inshorts-style top strip. Some tabs filter the feed; a couple open other screens.
type StripTab = { key: string; label: string; kind: 'feed' | 'all' | 'videos' | 'cat' | 'marketing' | 'rates'; route?: string };

// Animated FlatList so each card can fade + scale as it swipes into view.
const AList: any = Animated.FlatList;

const NOTIF_SINCE_KEY = 'mb:notifSince'; // last time the user checked notifications

export default function Feed() {
  const { palette, category, setCategory, isDark, setMode, interests, myPosts, registerArticles, openArticle, liked, saved, history, muted } = useApp();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [h, setH] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [live, setLive] = useState<Article[] | null>(null); // live backend articles
  const [blogs, setBlogs] = useState<Article[]>([]); // ZoltMoney blog posts
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0); // bumps each refresh to reshuffle the lead
  // In-app "new stories" bell (each item stamped with when it arrived)
  const [arrivals, setArrivals] = useState<Array<Article & { arrivedAt: number }>>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifiedIdsRef = useRef<Set<string>>(new Set());
  // Only notify for content published AFTER this time — set to "last time you
  // checked". Default: last 24h, so today's ZoltMoney + news show on open.
  const notifSinceRef = useRef<number>(Date.now() - 24 * 60 * 60 * 1000);
  const [tab, setTab] = useState<string>('For You');
  const didMount = useRef(false);
  const listRef = useRef<FlatList<Article>>(null);
  const scrollY = useRef(new Animated.Value(0)).current;
  const refreshingRef = useRef(false);
  const lastHomeTapRef = useRef(0);
  const navigation = useNavigation();
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

  // Notify for any story (ZoltMoney or news) published since you last checked
  // and within roughly the last day — so today's fresh content shows, old
  // fetched posts don't. Treats ZoltMoney and news the same way.
  const noteArrivals = useCallback((list: Article[]) => {
    if (!list?.length) return;
    const now = Date.now();
    const RECENT_MS = 36 * 60 * 60 * 1000; // ~today
    const since = notifSinceRef.current;
    const add: Array<Article & { arrivedAt: number }> = [];
    for (const a of list) {
      if (!a || !a.id || notifiedIdsRef.current.has(a.id)) continue;
      const t = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
      if (t > since && now - t < RECENT_MS) {
        notifiedIdsRef.current.add(a.id);
        add.push({ ...a, arrivedAt: now });
      }
    }
    if (add.length) {
      setArrivals((prev) =>
        [...add, ...prev]
          .sort((x, y) => new Date(y.publishedAt).getTime() - new Date(x.publishedAt).getTime())
          .slice(0, 40),
      );
    }
  }, []);

  // Load live news + ZoltMoney blogs on mount.
  useEffect(() => {
    // Restore "last checked" time so we only alert on content newer than that.
    AsyncStorage.getItem(NOTIF_SINCE_KEY).then((v) => {
      if (v) notifSinceRef.current = Number(v);
    });
    registerArticles([...MY_ARTICLES, ...ARTICLES]); // bundled/seed → searchable immediately
    fetchNews().then((a) => {
      if (a.length) {
        setLive([...MY_ARTICLES, ...a]);
        registerArticles(a);
        noteArrivals(a);
      }
    });
    // Blogs, fastest → fullest so they appear the instant the app opens:
    // 1) show last-saved blogs immediately (no network wait)
    // 2) a quick light fetch for fresh titles/images
    // 3) enrich with fuller ~110-word summaries in the background
    loadCachedBlogs().then((c) => {
      if (c.length) {
        setBlogs((prev) => (prev.length ? prev : c));
        registerArticles(c);
        noteArrivals(c);
      }
    });
    fetchBlogsFast()
      .then((b) => {
        if (b.length) {
          setBlogs(b);
          registerArticles(b);
          noteArrivals(b);
        }
      })
      .finally(() => {
        fetchBlogs().then((b) => {
          if (b.length) {
            setBlogs(b);
            registerArticles(b);
            noteArrivals(b);
          }
        });
      });
  }, []);

  // Keep your own posts searchable too.
  useEffect(() => {
    if (myPosts.length) registerArticles(myPosts);
  }, [myPosts, registerArticles]);

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
      { key: 'For You', label: 'For You', kind: 'feed' },
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

  // Affinity: how much you like each category, learned from follows + likes +
  // saves + reads. Drives the "For You" ranking.
  const affinity = useMemo(() => {
    const w: Record<string, number> = {};
    const bump = (cat?: string, n = 1) => {
      if (cat) w[cat] = (w[cat] || 0) + n;
    };
    interests.forEach((c) => bump(c as string, 3));
    liked.forEach((a) => bump(a.category, 2.5));
    saved.forEach((a) => bump(a.category, 1.5));
    history.forEach((a) => bump(a.category, 1));
    return w;
  }, [interests, liked, saved, history]);

  const notMuted = useCallback(
    (a: Article) => !muted.includes(a.category) && !muted.includes(a.source),
    [muted],
  );

  const data = useMemo(() => {
    // Newest first, always — so the feed leads with the latest / today's stories.
    const blogsLatest = byNewest(blogs).filter(notMuted); // ZoltMoney
    const newsLatest = byNewest(live ?? ARTICLES).filter((a) => a.category !== 'Blogs').filter(notMuted);

    // For You: rank by your affinity + recency, keeping ZoltMoney prominent.
    if (tab === 'For You') {
      const pool = [...blogsLatest, ...newsLatest];
      const now = Date.now();
      const scored = pool
        .map((a) => {
          const t = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
          const recency = t ? Math.max(0, 1 - (now - t) / (72 * 3600 * 1000)) : 0; // 0..1 over 3 days
          const base = a.category === 'Blogs' ? 1.5 : 0; // keep ZoltMoney prominent
          const score = (affinity[a.category] || 0) + base + recency * 1.5;
          return { a, score };
        })
        .sort((x, y) => y.score - x.score)
        .map((x) => x.a);
      const led = refreshTick > 0 ? rotate(scored, refreshTick * 4) : scored;
      return [...myPosts.filter(notMuted), ...led];
    }

    // My Feed / All: ZoltMoney-heavy mix (2 blogs : 1 news), newest-first.
    if (tab === 'My Feed' || tab === 'All') {
      const mix = interleave(blogsLatest, newsLatest, 2, 1);
      const led = refreshTick > 0 ? rotate(mix, refreshTick * 4) : mix;
      return [...myPosts.filter(notMuted), ...led];
    }
    if (tab === 'Videos') return byNewest([...blogsLatest, ...newsLatest]).filter((a) => a.videoUrl);
    if (tab === 'Marketing News') return newsLatest.filter((a) => a.category !== 'Markets');
    if (tab === 'Rate News' || tab === 'Finance') return newsLatest.filter((a) => a.category === 'Markets');
    return byNewest([...myPosts, ...blogsLatest, ...newsLatest]).filter((a) => a.category === tab);
  }, [live, blogs, tab, interests, myPosts, refreshTick, affinity, notMuted]);

  useEffect(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: false });
  }, [tab]);


  const onRefresh = useCallback(async () => {
    if (refreshingRef.current) return;
    refreshingRef.current = true;
    setRefreshing(true);
    try {
      // Refetch blogs + news; newest items sort to the top automatically.
      fetchBlogsFast().then((b) => {
        if (b.length) {
          setBlogs(b);
          registerArticles(b);
          noteArrivals(b);
        }
      });
      const a = await fetchNews();
      if (a.length) {
        setLive([...MY_ARTICLES, ...a]);
        registerArticles(a);
        noteArrivals(a);
      }
      setRefreshTick((n) => n + 1); // reshuffle the lead so the feed visibly changes
      listRef.current?.scrollToOffset({ offset: 0, animated: true });
    } finally {
      setRefreshing(false);
      refreshingRef.current = false;
    }
  }, [registerArticles, noteArrivals]);

  // Double-tap the Home tab (bottom nav): snap all cards back to the top, then
  // load fresh news.
  useEffect(() => {
    const unsub = (navigation as any)?.addListener?.('tabPress', () => {
      const now = Date.now();
      if (now - lastHomeTapRef.current < 320) {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
        onRefresh();
      }
      lastHomeTapRef.current = now;
    });
    return unsub;
  }, [navigation, onRefresh]);

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
          <Pressable
            onPress={() => {
              setNotifOpen(true);
              // Mark as read: only newer content alerts next time.
              const now = Date.now();
              notifSinceRef.current = now;
              AsyncStorage.setItem(NOTIF_SINCE_KEY, String(now)).catch(() => {});
            }}
            hitSlop={8}
            style={styles.edgeBtn}>
            <Ionicons name={arrivals.length ? 'notifications' : 'notifications-outline'} size={21} color={arrivals.length ? palette.accent : palette.text} />
            {arrivals.length > 0 && (
              <View style={[styles.badge, { backgroundColor: palette.accent, borderColor: palette.bg }]}>
                <Text style={styles.badgeText}>{arrivals.length > 9 ? '9+' : arrivals.length}</Text>
              </View>
            )}
          </Pressable>
          <Pressable onPress={() => setMode(isDark ? 'light' : 'dark')} hitSlop={8} style={styles.edgeBtn}>
            <Ionicons name={isDark ? 'sunny-outline' : 'moon-outline'} size={20} color={palette.text} />
          </Pressable>
        </View>
      </View>

      {/* ── New-stories notification panel ── */}
      <Modal visible={notifOpen} transparent animationType="fade" onRequestClose={() => setNotifOpen(false)}>
        <Pressable style={styles.notifBackdrop} onPress={() => setNotifOpen(false)}>
          <Pressable style={[styles.notifSheet, { backgroundColor: palette.card, borderColor: palette.border, marginTop: insets.top + 54 }]}>
            <View style={styles.notifHead}>
              <Text style={[styles.notifTitle, { color: palette.text }]}>
                {arrivals.length ? `${arrivals.length} new ${arrivals.length === 1 ? 'story' : 'stories'} arrived` : 'Notifications'}
              </Text>
              {arrivals.length > 0 && (
                <Pressable onPress={() => setArrivals([])} hitSlop={8}>
                  <Text style={[styles.notifClear, { color: palette.accent }]}>Clear</Text>
                </Pressable>
              )}
            </View>
            {arrivals.length === 0 ? (
              <View style={styles.notifEmpty}>
                <Ionicons name="notifications-off-outline" size={30} color={palette.textMuted} />
                <Text style={{ color: palette.textMuted, marginTop: 8 }}>You’re all caught up</Text>
              </View>
            ) : (
              <FlatList
                data={arrivals}
                keyExtractor={(a) => `n-${a.id}`}
                style={{ maxHeight: 380 }}
                renderItem={({ item }) => (
                  <Pressable
                    onPress={() => {
                      setNotifOpen(false);
                      openArticle(item);
                    }}
                    style={[styles.notifRow, { borderBottomColor: palette.border }]}>
                    <View style={[styles.notifDot, { backgroundColor: item.accent || palette.accent }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.notifRowTitle, { color: palette.text }]} numberOfLines={2}>
                        {item.title}
                      </Text>
                      <Text style={[styles.notifRowMeta, { color: palette.textMuted }]}>{item.source} · {timeAgo(item.publishedAt)}</Text>
                    </View>
                  </Pressable>
                )}
              />
            )}
          </Pressable>
        </Pressable>
      </Modal>

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
      {/* Custom touch-pull only on web (RN's RefreshControl handles native, and
          attaching these on native would fight the built-in pull gesture). */}
      <View
        style={[styles.feed, Platform.OS === 'web' ? ({ overscrollBehaviorY: 'contain' } as any) : null]}
        onLayout={(e) => setH(Math.round(e.nativeEvent.layout.height))}
        {...(Platform.OS === 'web'
          ? { onTouchStart, onTouchMove, onTouchEnd, onTouchCancel: onTouchEnd }
          : {})}>
        {/* Pull spinner on web (native uses the OS RefreshControl spinner) */}
        {Platform.OS === 'web' && (pull > 0 || refreshing) && (
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
            onScrollToIndexFailed={() => {}}
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
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { color: '#fff', fontSize: 9.5, fontWeight: '900' },
  notifBackdrop: { flex: 1, backgroundColor: '#0006' },
  notifSheet: {
    marginHorizontal: 12,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  notifHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 10 },
  notifTitle: { fontSize: 15, fontWeight: '800' },
  notifClear: { fontSize: 13, fontWeight: '700' },
  notifEmpty: { alignItems: 'center', justifyContent: 'center', paddingVertical: 34 },
  notifRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  notifDot: { width: 8, height: 8, borderRadius: 4 },
  notifRowTitle: { fontSize: 14, fontWeight: '700', lineHeight: 19 },
  notifRowMeta: { fontSize: 11.5, marginTop: 3 },
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
