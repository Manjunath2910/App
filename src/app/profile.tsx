// ─── Profile — stats · interests · language · appearance ──────────────────────
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SignIn from '@/components/SignIn';
import { CATEGORIES } from '@/data/news';
import { useT } from '@/i18n';
import { useApp, type Lang } from '@/store/app';
import type { ThemeMode } from '@/constants/appTheme';

const TOPICS = CATEGORIES.filter((c) => c !== 'All') as string[];

export default function Profile() {
  const { palette, stats, bookmarks, interests, toggleInterest, lang, setLang, mode, setMode, user, signOut } = useApp();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [showSignIn, setShowSignIn] = useState(false);

  const modes: { key: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { key: 'system', label: t('system'), icon: 'phone-portrait-outline' },
    { key: 'light', label: t('lightMode'), icon: 'sunny-outline' },
    { key: 'dark', label: t('darkMode'), icon: 'moon-outline' },
  ];
  const langs: { key: Lang; label: string }[] = [
    { key: 'en', label: 'English' },
    { key: 'hi', label: 'हिन्दी' },
    { key: 'kn', label: 'ಕನ್ನಡ' },
  ];
  const initial = (user?.name || 'M').trim().charAt(0).toUpperCase();

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {/* Header */}
        <View style={styles.header}>
          <View style={[styles.avatar, { backgroundColor: palette.accent }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.name, { color: palette.text }]} numberOfLines={1}>
              {user ? user.name : t('guest')}
            </Text>
            <Text style={[styles.hi, { color: palette.textMuted }]} numberOfLines={1}>
              {user ? user.email : t('brand')}
            </Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="flame" size={15} color={palette.accent} />
            <Text style={[styles.streakText, { color: palette.accent }]}>{stats.streak}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat value={stats.read} label={t('storiesRead')} palette={palette} />
          <Stat value={stats.streak} label={t('dayStreak')} palette={palette} />
          <Pressable style={{ flex: 1 }} onPress={() => router.navigate('/bookmarks')}>
            <Stat value={bookmarks.length} label={t('savedCount')} palette={palette} />
          </Pressable>
        </View>

        {/* Interests */}
        <Section title={t('yourInterests')} desc={t('interestsDesc')} palette={palette} />
        <View style={styles.chips}>
          {TOPICS.map((c) => {
            const on = interests.includes(c as never);
            return (
              <Pressable
                key={c}
                onPress={() => toggleInterest(c as never)}
                style={[
                  styles.chip,
                  on
                    ? { backgroundColor: palette.accent }
                    : { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth },
                ]}>
                {on && <Ionicons name="checkmark" size={14} color={palette.accentText} />}
                <Text style={[styles.chipText, { color: on ? palette.accentText : palette.text }]}>{c}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Language */}
        <Section title={t('language')} palette={palette} />
        <View style={styles.segRow}>
          {langs.map((l) => {
            const on = lang === l.key;
            return (
              <Pressable
                key={l.key}
                onPress={() => setLang(l.key)}
                style={[styles.seg, { backgroundColor: on ? palette.accent : palette.card, borderColor: palette.border }]}>
                <Text style={[styles.segText, { color: on ? palette.accentText : palette.text }]}>{l.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Appearance */}
        <Section title={t('appearance')} palette={palette} />
        <View style={styles.segRow}>
          {modes.map((m) => {
            const on = mode === m.key;
            return (
              <Pressable
                key={m.key}
                onPress={() => setMode(m.key)}
                style={[styles.seg, { backgroundColor: on ? palette.accent : palette.card, borderColor: palette.border }]}>
                <Ionicons name={m.icon} size={16} color={on ? palette.accentText : palette.text} />
                <Text style={[styles.segText, { color: on ? palette.accentText : palette.text }]}>{m.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {/* Account */}
        <Section title={t('account')} palette={palette} />
        <View style={{ paddingHorizontal: 18 }}>
          {user ? (
            <Pressable
              onPress={signOut}
              style={[styles.authBtn, { backgroundColor: palette.card, borderColor: palette.border }]}>
              <Ionicons name="log-out-outline" size={19} color={palette.accent} />
              <Text style={[styles.authText, { color: palette.accent }]}>{t('signOut')}</Text>
            </Pressable>
          ) : (
            <Pressable onPress={() => setShowSignIn(true)} style={[styles.authBtn, { backgroundColor: palette.accent }]}>
              <Ionicons name="log-in-outline" size={19} color="#fff" />
              <Text style={[styles.authText, { color: '#fff' }]}>{t('signIn')}</Text>
            </Pressable>
          )}
        </View>

        <Text style={[styles.footer, { color: palette.textFaint }]}>{t('brand')} · {t('tagline')}</Text>
      </ScrollView>

      <SignIn visible={showSignIn} onClose={() => setShowSignIn(false)} />
    </View>
  );
}

function Stat({ value, label, palette }: { value: number; label: string; palette: any }) {
  return (
    <View style={[styles.stat, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Text style={[styles.statValue, { color: palette.text }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: palette.textMuted }]}>{label}</Text>
    </View>
  );
}

function Section({ title, desc, palette }: { title: string; desc?: string; palette: any }) {
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: palette.text }]}>{title}</Text>
      {desc ? <Text style={[styles.sectionDesc, { color: palette.textMuted }]}>{desc}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 13, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 16 },
  avatar: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 26, fontWeight: '900' },
  name: { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  hi: { fontSize: 13, marginTop: 2 },
  streakBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 999 },
  streakText: { fontSize: 14, fontWeight: '900' },
  statsRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 18 },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 11.5, marginTop: 3, fontWeight: '600' },
  section: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 10 },
  sectionTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  sectionDesc: { fontSize: 13, marginTop: 3 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 9, paddingHorizontal: 18 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999 },
  chipText: { fontSize: 13.5, fontWeight: '700' },
  segRow: { flexDirection: 'row', gap: 10, paddingHorizontal: 18 },
  seg: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 13,
    borderWidth: StyleSheet.hairlineWidth,
  },
  segText: { fontSize: 14, fontWeight: '700' },
  authBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 50,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
  },
  authText: { fontSize: 15.5, fontWeight: '800' },
  footer: { textAlign: 'center', fontSize: 12, marginTop: 28, paddingHorizontal: 20 },
});
