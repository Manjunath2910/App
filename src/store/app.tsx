// ─── Global app state: theme · bookmarks · interests · language · stats ───────
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

import { PALETTE, type Palette, type ThemeMode } from '@/constants/appTheme';
import type { Article, Category } from '@/data/news';

export type Lang = 'en' | 'hi' | 'kn';
export type Stats = { read: number; streak: number; lastRead: string };
export type User = { name: string; email: string };
type Interest = Exclude<Category, 'All'>;

type AppState = {
  palette: Palette;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  bookmarks: string[];
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (id: string) => void;
  category: Category;
  setCategory: (c: Category) => void;
  article: Article | null;
  openArticle: (a: Article) => void;
  closeArticle: () => void;
  fontScale: number;
  cycleFontScale: () => void;
  interests: Interest[];
  toggleInterest: (c: Interest) => void;
  lang: Lang;
  setLang: (l: Lang) => void;
  stats: Stats;
  reminderOn: boolean;
  setReminderOn: (v: boolean) => void;
  user: User | null;
  signIn: (u: User) => void;
  signOut: () => void;
  myPosts: Article[];
  addPost: (a: Article) => void;
  removePost: (id: string) => void;
};

const FONT_STEPS = [1, 1.12, 1.26];

const AppCtx = createContext<AppState | null>(null);

const MODE_KEY = 'mb:mode';
const BOOKMARKS_KEY = 'mb:bookmarks';
const FONT_KEY = 'mb:fontscale';
const INTERESTS_KEY = 'mb:interests';
const LANG_KEY = 'mb:lang';
const STATS_KEY = 'mb:stats';
const REMINDER_KEY = 'mb:reminder';
const USER_KEY = 'mb:user';
const POSTS_KEY = 'mb:posts';

const todayStr = () => new Date().toISOString().slice(0, 10);
const yesterdayStr = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [category, setCategory] = useState<Category>('All');
  const [article, setArticle] = useState<Article | null>(null);
  const [fontScale, setFontScale] = useState(1);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [lang, setLangState] = useState<Lang>('en');
  const [stats, setStats] = useState<Stats>({ read: 0, streak: 0, lastRead: '' });
  const [reminderOn, setReminderOnState] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [myPosts, setMyPosts] = useState<Article[]>([]);

  // Load persisted settings once.
  useEffect(() => {
    (async () => {
      try {
        const [m, b, f, i, l, s, r, u, p] = await Promise.all([
          AsyncStorage.getItem(MODE_KEY),
          AsyncStorage.getItem(BOOKMARKS_KEY),
          AsyncStorage.getItem(FONT_KEY),
          AsyncStorage.getItem(INTERESTS_KEY),
          AsyncStorage.getItem(LANG_KEY),
          AsyncStorage.getItem(STATS_KEY),
          AsyncStorage.getItem(REMINDER_KEY),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(POSTS_KEY),
        ]);
        if (m === 'light' || m === 'dark' || m === 'system') setModeState(m);
        if (b) setBookmarks(JSON.parse(b));
        if (f && FONT_STEPS.includes(Number(f))) setFontScale(Number(f));
        if (i) setInterests(JSON.parse(i));
        if (l === 'en' || l === 'hi' || l === 'kn') setLangState(l);
        if (s) setStats(JSON.parse(s));
        if (r === '1') setReminderOnState(true);
        if (u) setUser(JSON.parse(u));
        if (p) setMyPosts(JSON.parse(p));
      } catch {
        // ignore — first run
      }
    })();
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(MODE_KEY, m).catch(() => {});
  }, []);

  const cycleFontScale = useCallback(() => {
    setFontScale((prev) => {
      const i = FONT_STEPS.indexOf(prev);
      const next = FONT_STEPS[(i + 1) % FONT_STEPS.length];
      AsyncStorage.setItem(FONT_KEY, String(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleBookmark = useCallback((id: string) => {
    setBookmarks((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [id, ...prev];
      AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleInterest = useCallback((c: Interest) => {
    setInterests((prev) => {
      const next = prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c];
      AsyncStorage.setItem(INTERESTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    AsyncStorage.setItem(LANG_KEY, l).catch(() => {});
  }, []);

  const setReminderOn = useCallback((v: boolean) => {
    setReminderOnState(v);
    AsyncStorage.setItem(REMINDER_KEY, v ? '1' : '0').catch(() => {});
  }, []);

  const signIn = useCallback((u: User) => {
    setUser(u);
    AsyncStorage.setItem(USER_KEY, JSON.stringify(u)).catch(() => {});
  }, []);

  const signOut = useCallback(() => {
    setUser(null);
    AsyncStorage.removeItem(USER_KEY).catch(() => {});
    // Best-effort: end the Firebase/Google native session too.
    import('@/services/auth').then((m) => m.signOutAll()).catch(() => {});
  }, []);

  const addPost = useCallback((a: Article) => {
    setMyPosts((prev) => {
      const next = [a, ...prev];
      AsyncStorage.setItem(POSTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const removePost = useCallback((id: string) => {
    setMyPosts((prev) => {
      const next = prev.filter((x) => x.id !== id);
      AsyncStorage.setItem(POSTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Count a read and keep a daily streak going.
  const recordRead = useCallback(() => {
    setStats((prev) => {
      const today = todayStr();
      let streak = prev.streak;
      if (prev.lastRead !== today) {
        streak = prev.lastRead === yesterdayStr() ? prev.streak + 1 : 1;
      }
      const next = { read: prev.read + 1, streak: Math.max(1, streak), lastRead: today };
      AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const openArticle = useCallback(
    (a: Article) => {
      setArticle(a);
      recordRead();
    },
    [recordRead],
  );

  const isDark = mode === 'system' ? system === 'dark' : mode === 'dark';
  const palette = isDark ? PALETTE.dark : PALETTE.light;

  const value = useMemo<AppState>(
    () => ({
      palette,
      isDark,
      mode,
      setMode,
      bookmarks,
      isBookmarked: (id: string) => bookmarks.includes(id),
      toggleBookmark,
      category,
      setCategory,
      article,
      openArticle,
      closeArticle: () => setArticle(null),
      fontScale,
      cycleFontScale,
      interests,
      toggleInterest,
      lang,
      setLang,
      stats,
      reminderOn,
      setReminderOn,
      user,
      signIn,
      signOut,
      myPosts,
      addPost,
      removePost,
    }),
    [
      palette, isDark, mode, setMode, bookmarks, toggleBookmark, category, article, openArticle,
      fontScale, cycleFontScale, interests, toggleInterest, lang, setLang, stats, reminderOn, setReminderOn,
      user, signIn, signOut, myPosts, addPost, removePost,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
