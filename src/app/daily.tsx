// ─── Daily Digest — today's top marketing picks + a daily reminder ────────────
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ARTICLES, timeAgo, type Article } from '@/data/news';
import { fetchNews } from '@/data/remote';
import { useT } from '@/i18n';
import { useApp } from '@/store/app';
import { disableDailyReminder, enableDailyReminder } from '@/utils/notify';

export default function Daily() {
  const { palette, openArticle, reminderOn, setReminderOn } = useApp();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [live, setLive] = useState<Article[] | null>(null);

  useEffect(() => {
    fetchNews().then((a) => a.length && setLive(a));
  }, []);

  const onToggleReminder = async (v: boolean) => {
    try {
      if (v) {
        const ok = await enableDailyReminder();
        setReminderOn(ok);
      } else {
        await disableDailyReminder();
        setReminderOn(false);
      }
    } catch {
      setReminderOn(v); // module not ready → keep the preference
    }
  };

  const picks = useMemo(() => (live ?? ARTICLES).slice(0, 10), [live]);
  const [lead, ...rest] = picks;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: palette.accent }]}>{today.toUpperCase()}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{t('dailyDigest')}</Text>
          <Text style={[styles.sub, { color: palette.textMuted }]}>{t('todaysPicks')}</Text>
        </View>

        {/* Reminder toggle */}
        <View style={[styles.reminder, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={[styles.reminderIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="notifications-outline" size={20} color={palette.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reminderTitle, { color: palette.text }]}>{t('dailyReminder')}</Text>
            <Text style={[styles.reminderDesc, { color: palette.textMuted }]}>{t('reminderDesc')}</Text>
          </View>
          <Switch
            value={reminderOn}
            onValueChange={onToggleReminder}
            trackColor={{ true: palette.accent, false: palette.surfaceAlt }}
            thumbColor="#fff"
          />
        </View>

        {/* Lead story */}
        {lead && (
          <Pressable onPress={() => openArticle(lead)} style={[styles.lead, { backgroundColor: palette.imgPlaceholder }]}>
            <Image source={{ uri: lead.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.leadShade} />
            <View style={[styles.leadChip, { backgroundColor: lead.accent }]}>
              <Text style={styles.leadChipText}>{lead.category.toUpperCase()}</Text>
            </View>
            <View style={styles.leadFooter}>
              <Text style={styles.leadTitle} numberOfLines={3}>
                {lead.title}
              </Text>
              <Text style={styles.leadMeta}>
                {lead.source} · {timeAgo(lead.publishedAt)}
              </Text>
            </View>
          </Pressable>
        )}

        {/* Rest of the picks */}
        <View style={{ paddingHorizontal: 18, marginTop: 8 }}>
          {rest.map((item, i) => (
            <Pressable
              key={item.id}
              onPress={() => openArticle(item)}
              style={[styles.row, { borderBottomColor: palette.border }]}>
              <Text style={[styles.rowNum, { color: palette.accent }]}>{String(i + 2).padStart(2, '0')}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={2}>
                  {item.title}
                </Text>
                <Text style={[styles.rowMeta, { color: palette.textMuted }]}>
                  {item.source} · {timeAgo(item.publishedAt)}
                </Text>
              </View>
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  kicker: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  sub: { fontSize: 14.5, marginTop: 3 },
  reminder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 18,
    padding: 14,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 16,
  },
  reminderIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  reminderTitle: { fontSize: 15, fontWeight: '800' },
  reminderDesc: { fontSize: 12.5, marginTop: 2 },
  lead: { height: 230, marginHorizontal: 18, borderRadius: 18, overflow: 'hidden', justifyContent: 'flex-end' },
  leadShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.28)' },
  leadChip: { position: 'absolute', left: 14, top: 14, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  leadChipText: { color: '#fff', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.7 },
  leadFooter: { padding: 16 },
  leadTitle: { color: '#fff', fontSize: 20, fontWeight: '800', lineHeight: 26, letterSpacing: -0.3 },
  leadMeta: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 8, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  rowNum: { fontSize: 15, fontWeight: '900', width: 24 },
  rowTitle: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  rowMeta: { fontSize: 12, marginTop: 5 },
  thumb: { width: 66, height: 66, borderRadius: 12, backgroundColor: '#0002' },
});
