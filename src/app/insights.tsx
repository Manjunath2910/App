// ─── Insights (explainer cards) + Timelines (developing stories) ──────────────
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COMPARISONS } from '@/data/comparisons';
import { INSIGHTS, TIMELINES } from '@/data/insights';
import { useT } from '@/i18n';
import { useApp } from '@/store/app';

export default function Insights() {
  const { palette } = useApp();
  const t = useT();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: palette.text }]}>{t('insightsTitle')}</Text>
          <Text style={[styles.sub, { color: palette.textMuted }]}>{t('insightsDesc')}</Text>
        </View>

        {/* App comparisons — money transfer & converter apps */}
        <View style={[styles.header, { paddingTop: 4 }]}>
          <Text style={[styles.title, { color: palette.text }]}>App comparisons</Text>
          <Text style={[styles.sub, { color: palette.textMuted }]}>Money transfer & converter apps, compared</Text>
        </View>
        {COMPARISONS.map((c) => (
          <View key={c.id} style={[styles.cmp, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={{ height: 120, backgroundColor: palette.imgPlaceholder }}>
              <Image source={{ uri: c.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.tlShade} />
              <View style={styles.cmpHead}>
                <Text style={styles.cmpTitle} numberOfLines={2}>{c.title}</Text>
                <Text style={styles.cmpNote}>{c.note}</Text>
              </View>
            </View>
            <View style={{ padding: 14 }}>
              {c.apps.map((a, i) => (
                <View key={a.name} style={[styles.appRow, i > 0 && { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.appTop}>
                      <Text style={[styles.appName, { color: palette.text }]}>{a.name}</Text>
                      <View style={styles.stars}>
                        <Ionicons name="star" size={12} color="#F59E0B" />
                        <Text style={[styles.rating, { color: palette.textMuted }]}>{a.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    <View style={[styles.bestChip, { backgroundColor: c.accent + '22' }]}>
                      <Text style={[styles.bestText, { color: c.accent }]}>{a.bestFor}</Text>
                    </View>
                    <Text style={[styles.appMeta, { color: palette.textMuted }]}>
                      Fee: {a.fee} · {a.speed}
                    </Text>
                  </View>
                </View>
              ))}
              <View style={[styles.verdict, { backgroundColor: palette.surfaceAlt }]}>
                <Ionicons name="trophy-outline" size={15} color={c.accent} />
                <Text style={[styles.verdictText, { color: palette.text }]}>{c.verdict}</Text>
              </View>
            </View>
          </View>
        ))}

        {/* Insight cards */}
        {INSIGHTS.map((it) => (
          <View key={it.id} style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={styles.cardHead}>
              <View style={[styles.termChip, { backgroundColor: it.accent }]}>
                <Text style={styles.termText}>{it.term}</Text>
              </View>
              <Text style={[styles.cardCat, { color: palette.textMuted }]}>{it.category}</Text>
            </View>
            <Text style={[styles.what, { color: palette.text }]}>{it.what}</Text>
            <View style={[styles.whyRow, { borderTopColor: palette.border }]}>
              <Ionicons name="bulb-outline" size={16} color={it.accent} />
              <Text style={[styles.why, { color: palette.textMuted }]}>{it.why}</Text>
            </View>
          </View>
        ))}

        {/* Timelines */}
        <View style={[styles.header, { paddingTop: 26 }]}>
          <Text style={[styles.title, { color: palette.text }]}>{t('timelines')}</Text>
          <Text style={[styles.sub, { color: palette.textMuted }]}>{t('timelinesDesc')}</Text>
        </View>

        {TIMELINES.map((tl) => (
          <View key={tl.id} style={[styles.tl, { backgroundColor: palette.card, borderColor: palette.border }]}>
            <View style={{ height: 150, backgroundColor: palette.imgPlaceholder }}>
              <Image source={{ uri: tl.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
              <View style={styles.tlShade} />
              <Text style={styles.tlTitle} numberOfLines={2}>
                {tl.title}
              </Text>
            </View>
            <View style={{ padding: 16 }}>
              {tl.events.map((ev, i) => (
                <View key={i} style={styles.evRow}>
                  <View style={styles.evLine}>
                    <View style={[styles.evDot, { backgroundColor: tl.accent }]} />
                    {i < tl.events.length - 1 && <View style={[styles.evBar, { backgroundColor: palette.border }]} />}
                  </View>
                  <View style={{ flex: 1, paddingBottom: 16 }}>
                    <Text style={[styles.evDate, { color: tl.accent }]}>{ev.date}</Text>
                    <Text style={[styles.evText, { color: palette.text }]}>{ev.text}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 12 },
  title: { fontSize: 26, fontWeight: '900', letterSpacing: -0.6 },
  sub: { fontSize: 14, marginTop: 3 },
  card: { marginHorizontal: 18, marginBottom: 12, padding: 16, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth },
  cardHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  termChip: { paddingHorizontal: 11, paddingVertical: 5, borderRadius: 8 },
  termText: { color: '#fff', fontSize: 13, fontWeight: '800', letterSpacing: 0.3 },
  cardCat: { fontSize: 12, fontWeight: '700' },
  what: { fontSize: 15, lineHeight: 22 },
  whyRow: { flexDirection: 'row', gap: 8, marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth },
  why: { flex: 1, fontSize: 13.5, lineHeight: 20, fontStyle: 'italic' },
  tl: { marginHorizontal: 18, marginBottom: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  tlShade: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.35)' },
  tlTitle: { position: 'absolute', left: 14, right: 14, bottom: 12, color: '#fff', fontSize: 17, fontWeight: '800', lineHeight: 22 },
  evRow: { flexDirection: 'row', gap: 12 },
  evLine: { alignItems: 'center', width: 14 },
  evDot: { width: 12, height: 12, borderRadius: 6, marginTop: 3 },
  evBar: { width: 2, flex: 1, marginTop: 2 },
  evDate: { fontSize: 12, fontWeight: '800', marginBottom: 3 },
  evText: { fontSize: 14, lineHeight: 20 },
  cmp: { marginHorizontal: 18, marginBottom: 14, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cmpHead: { position: 'absolute', left: 14, right: 14, bottom: 12 },
  cmpTitle: { color: '#fff', fontSize: 18, fontWeight: '900', lineHeight: 23 },
  cmpNote: { color: 'rgba(255,255,255,0.9)', fontSize: 12.5, marginTop: 3, fontWeight: '600' },
  appRow: { paddingVertical: 12 },
  appTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  appName: { fontSize: 16, fontWeight: '800' },
  stars: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  rating: { fontSize: 12.5, fontWeight: '700' },
  bestChip: { alignSelf: 'flex-start', paddingHorizontal: 9, paddingVertical: 3, borderRadius: 7, marginTop: 6 },
  bestText: { fontSize: 11.5, fontWeight: '800' },
  appMeta: { fontSize: 12.5, marginTop: 6 },
  verdict: { flexDirection: 'row', gap: 8, alignItems: 'flex-start', marginTop: 12, padding: 12, borderRadius: 12 },
  verdictText: { flex: 1, fontSize: 13.5, lineHeight: 20, fontWeight: '600' },
});

