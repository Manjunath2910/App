// ─── PollCard — interactive poll (Inshorts-style) ─────────────────────────────
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Poll } from '@/data/polls';
import { useApp } from '@/store/app';

export default function PollCard({ poll }: { poll: Poll }) {
  const { palette } = useApp();
  const [voted, setVoted] = useState<string | null>(null);

  const total = useMemo(
    () => poll.options.reduce((s, o) => s + o.votes + (voted === o.id ? 1 : 0), 0),
    [poll, voted],
  );

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <Image source={{ uri: poll.imageUrl }} style={styles.image} contentFit="cover" transition={200} />
      <View style={styles.body}>
        <Text style={[styles.context, { color: palette.textMuted }]}>{poll.context}</Text>
        <Text style={[styles.question, { color: palette.text }]}>{poll.question}</Text>

        <View style={{ gap: 10, marginTop: 14 }}>
          {poll.options.map((o) => {
            const votes = o.votes + (voted === o.id ? 1 : 0);
            const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
            const selected = voted === o.id;

            if (!voted) {
              return (
                <Pressable
                  key={o.id}
                  onPress={() => setVoted(o.id)}
                  style={({ pressed }) => [
                    styles.option,
                    { borderColor: palette.border, backgroundColor: palette.surface },
                    pressed && { opacity: 0.8 },
                  ]}>
                  <Text style={[styles.optionText, { color: palette.text }]}>{o.label}</Text>
                </Pressable>
              );
            }
            return (
              <View key={o.id} style={[styles.result, { backgroundColor: palette.surface, borderColor: selected ? palette.accent : palette.border }]}>
                <View style={[styles.resultFill, { width: `${pct}%`, backgroundColor: selected ? palette.accent : palette.surfaceAlt }]} />
                <View style={styles.resultRow}>
                  <Text style={[styles.optionText, { color: selected ? palette.accentText : palette.text }]}>
                    {o.label}
                    {selected ? '  ✓' : ''}
                  </Text>
                  <Text style={[styles.pct, { color: selected ? palette.accentText : palette.textMuted }]}>{pct}%</Text>
                </View>
              </View>
            );
          })}
        </View>

        <View style={styles.footer}>
          <Ionicons name="stats-chart-outline" size={14} color={palette.textMuted} />
          <Text style={[styles.footerText, { color: palette.textMuted }]}>
            {voted ? `${total.toLocaleString()} votes · thanks for voting` : `${total.toLocaleString()} votes · tap to vote`}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  image: { width: '100%', height: 150, backgroundColor: '#0002' },
  body: { padding: 16 },
  context: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  question: { fontSize: 17.5, fontWeight: '800', lineHeight: 24, marginTop: 6 },
  option: { paddingVertical: 13, paddingHorizontal: 16, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth },
  optionText: { fontSize: 14.5, fontWeight: '700' },
  result: { borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  resultFill: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  resultRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 13, paddingHorizontal: 16 },
  pct: { fontSize: 14, fontWeight: '800' },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14 },
  footerText: { fontSize: 12 },
});
