// ─── Global app state: theme · bookmarks · interests · language · stats ───────
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';

// expo-speech loaded lazily so the bundle/tsc never hard-depends on it.
let SpeechMod: any = null;
function speech(): any {
  if (!SpeechMod) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      SpeechMod = require('expo-speech');
    } catch {
      SpeechMod = { speak: () => {}, stop: () => {} };
    }
  }
  return SpeechMod;
}

import { PALETTE, type Palette, type ThemeMode } from '@/constants/appTheme';
import type { Article, Category } from '@/data/news';

export type Lang = 'en' | 'hi' | 'kn';
export type Stats = { read: number; streak: number; lastRead: string; today: number };
export const DAILY_GOAL = 5;
export type User = { name: string; email: string };
type Interest = Exclude<Category, 'All'>;

type AppState = {
  palette: Palette;
  isDark: boolean;
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  bookmarks: string[];
  saved: Article[];
  isBookmarked: (id: string) => boolean;
  toggleBookmark: (a: Article) => void;
  catalog: Article[];
  registerArticles: (list: Article[]) => void;
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
  // Text-to-speech (listen to a story)
  speakingId: string | null;
  speak: (a: Article, onDone?: () => void) => void;
  stopSpeak: () => void;
  // Reading history + continue reading
  history: Article[];
  clearHistory: () => void;
  // Likes
  liked: Article[];
  isLiked: (id: string) => boolean;
  toggleLike: (a: Article) => void;
  // Muted topics/sources (hidden from the feed)
  muted: string[];
  isMuted: (name: string) => boolean;
  toggleMute: (name: string) => void;
};

const FONT_STEPS = [1, 1.12, 1.26];

const AppCtx = createContext<AppState | null>(null);

const MODE_KEY = 'mb:mode';
const BOOKMARKS_KEY = 'mb:bookmarks';
const SAVED_KEY = 'mb:saved'; // full saved article objects (so blogs/news show in Saved)
const FONT_KEY = 'mb:fontscale';
const INTERESTS_KEY = 'mb:interests';
const LANG_KEY = 'mb:lang';
const STATS_KEY = 'mb:stats';
const REMINDER_KEY = 'mb:reminder';
const USER_KEY = 'mb:user';
const POSTS_KEY = 'mb:posts';
const HISTORY_KEY = 'mb:history';
const LIKED_KEY = 'mb:liked';
const MUTED_KEY = 'mb:muted';

const todayStr = () => new Date().toISOString().slice(0, 10);
const yesterdayStr = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);

// Merge new articles into an existing list, de-duped by id (existing wins order).
function mergeById(base: Article[], add: Article[]): Article[] {
  const seen = new Set(base.map((a) => a.id));
  const extra = add.filter((a) => a && a.id && !seen.has(a.id));
  return extra.length ? [...base, ...extra] : base;
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const system = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');
  const [saved, setSaved] = useState<Article[]>([]);
  const [catalog, setCatalog] = useState<Article[]>([]);
  const [category, setCategory] = useState<Category>('All');
  const [article, setArticle] = useState<Article | null>(null);
  const [fontScale, setFontScale] = useState(1);
  const [interests, setInterests] = useState<Interest[]>([]);
  const [lang, setLangState] = useState<Lang>('en');
  const [stats, setStats] = useState<Stats>({ read: 0, streak: 0, lastRead: '', today: 0 });
  const [liked, setLiked] = useState<Article[]>([]);
  const [muted, setMuted] = useState<string[]>([]);
  const [reminderOn, setReminderOnState] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [myPosts, setMyPosts] = useState<Article[]>([]);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [history, setHistory] = useState<Article[]>([]);

  // Load persisted settings once.
  useEffect(() => {
    (async () => {
      try {
        const [m, b, f, i, l, s, r, u, p, hist, lk, mt] = await Promise.all([
          AsyncStorage.getItem(MODE_KEY),
          AsyncStorage.getItem(SAVED_KEY),
          AsyncStorage.getItem(FONT_KEY),
          AsyncStorage.getItem(INTERESTS_KEY),
          AsyncStorage.getItem(LANG_KEY),
          AsyncStorage.getItem(STATS_KEY),
          AsyncStorage.getItem(REMINDER_KEY),
          AsyncStorage.getItem(USER_KEY),
          AsyncStorage.getItem(POSTS_KEY),
          AsyncStorage.getItem(HISTORY_KEY),
          AsyncStorage.getItem(LIKED_KEY),
          AsyncStorage.getItem(MUTED_KEY),
        ]);
        if (m === 'light' || m === 'dark' || m === 'sepia' || m === 'black' || m === 'system') setModeState(m);
        if (b) {
          const arr = JSON.parse(b);
          if (Array.isArray(arr)) {
            setSaved(arr);
            setCatalog((prev) => mergeById(prev, arr));
          }
        }
        if (f && FONT_STEPS.includes(Number(f))) setFontScale(Number(f));
        if (i) setInterests(JSON.parse(i));
        if (l === 'en' || l === 'hi' || l === 'kn') setLangState(l);
        if (s) {
          const st = JSON.parse(s);
          setStats({ read: st.read || 0, streak: st.streak || 0, lastRead: st.lastRead || '', today: st.lastRead === todayStr() ? st.today || 0 : 0 });
        }
        if (r === '1') setReminderOnState(true);
        if (u) setUser(JSON.parse(u));
        if (p) setMyPosts(JSON.parse(p));
        if (hist) {
          const arr = JSON.parse(hist);
          if (Array.isArray(arr)) {
            setHistory(arr);
            setCatalog((prev) => mergeById(prev, arr));
          }
        }
        if (lk) {
          const arr = JSON.parse(lk);
          if (Array.isArray(arr)) {
            setLiked(arr);
            setCatalog((prev) => mergeById(prev, arr));
          }
        }
        if (mt) {
          const arr = JSON.parse(mt);
          if (Array.isArray(arr)) setMuted(arr);
        }
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

  const toggleBookmark = useCallback((a: Article) => {
    setSaved((prev) => {
      const exists = prev.some((x) => x.id === a.id);
      const next = exists ? prev.filter((x) => x.id !== a.id) : [a, ...prev];
      AsyncStorage.setItem(SAVED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  // Collect every article the app has seen (bundled + live news + blogs + posts)
  // so Search and Saved can find anything, not just the small bundled list.
  const registerArticles = useCallback((list: Article[]) => {
    if (!list?.length) return;
    setCatalog((prev) => mergeById(prev, list));
  }, []);

  const bookmarks = useMemo(() => saved.map((a) => a.id), [saved]);

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

  // ── Text-to-speech: read a story aloud ──
  const stopSpeak = useCallback(() => {
    try {
      speech().stop();
    } catch {
      // ignore
    }
    setSpeakingId(null);
  }, []);

  const speak = useCallback((a: Article, onDone?: () => void) => {
    try {
      speech().stop();
    } catch {
      // ignore
    }
    const text = `${a.title}. ${a.summary}`.slice(0, 3800);
    setSpeakingId(a.id);
    speech().speak(text, {
      rate: 1.0,
      pitch: 1.0,
      onDone: () => {
        setSpeakingId(null);
        onDone?.();
      },
      onStopped: () => setSpeakingId(null),
      onError: () => setSpeakingId(null),
    });
  }, []);

  // Count a read and keep a daily streak going.
  const recordRead = useCallback(() => {
    setStats((prev) => {
      const today = todayStr();
      const isNewDay = prev.lastRead !== today;
      let streak = prev.streak;
      if (isNewDay) {
        streak = prev.lastRead === yesterdayStr() ? prev.streak + 1 : 1;
      }
      const next: Stats = {
        read: prev.read + 1,
        streak: Math.max(1, streak),
        lastRead: today,
        today: isNewDay ? 1 : (prev.today || 0) + 1,
      };
      AsyncStorage.setItem(STATS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleLike = useCallback((a: Article) => {
    setLiked((prev) => {
      const exists = prev.some((x) => x.id === a.id);
      const next = exists ? prev.filter((x) => x.id !== a.id) : [a, ...prev];
      AsyncStorage.setItem(LIKED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const toggleMute = useCallback((name: string) => {
    setMuted((prev) => {
      const next = prev.includes(name) ? prev.filter((x) => x !== name) : [...prev, name];
      AsyncStorage.setItem(MUTED_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, []);

  const openArticle = useCallback(
    (a: Article) => {
      setArticle(a);
      recordRead();
      setHistory((prev) => {
        const next = [a, ...prev.filter((x) => x.id !== a.id)].slice(0, 60);
        AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    [recordRead],
  );

  const clearHistory = useCallback(() => {
    setHistory([]);
    AsyncStorage.removeItem(HISTORY_KEY).catch(() => {});
  }, []);

  const resolved = mode === 'system' ? (system === 'dark' ? 'dark' : 'light') : mode;
  const isDark = resolved === 'dark' || resolved === 'black';
  const palette = (PALETTE as Record<string, Palette>)[resolved] ?? PALETTE.light;

  const value = useMemo<AppState>(
    () => ({
      palette,
      isDark,
      mode,
      setMode,
      bookmarks,
      saved,
      isBookmarked: (id: string) => bookmarks.includes(id),
      toggleBookmark,
      catalog,
      registerArticles,
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
      speakingId,
      speak,
      stopSpeak,
      history,
      clearHistory,
      liked,
      isLiked: (id: string) => liked.some((a) => a.id === id),
      toggleLike,
      muted,
      isMuted: (name: string) => muted.includes(name),
      toggleMute,
    }),
    [
      palette, isDark, mode, setMode, bookmarks, saved, toggleBookmark, catalog, registerArticles,
      category, article, openArticle,
      fontScale, cycleFontScale, interests, toggleInterest, lang, setLang, stats, reminderOn, setReminderOn,
      user, signIn, signOut, myPosts, addPost, removePost, speakingId, speak, stopSpeak, history, clearHistory,
      liked, toggleLike, muted, toggleMute,
    ],
  );

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppCtx);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
