// ─── CurrencyRates — live USD/EUR/GBP… → ₹ (INR) card ─────────────────────────
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { fetchRates, formatINR, type Rate } from '@/data/currency';
import { useApp } from '@/store/app';

export default function CurrencyRates() {
  const { palette } = useApp();
  const [rates, setRates] = useState<Rate[] | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);

  const load = () => {
    fetchRates().then((r) => {
      if (r.length) {
        setRates(r);
        setUpdated(new Date());
      } else {
        setRates([]);
      }
    });
  };

  useEffect(load, []);

  if (rates === null) {
    return (
      <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }
  if (rates.length === 0) return null;

  return (
    <View style={[styles.card, { backgroundColor: palette.card, borderColor: palette.border }]}>
      <View style={styles.head}>
        <View style={styles.headLeft}>
          <View style={[styles.icon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="cash-outline" size={17} color={palette.accent} />
          </View>
          <View>
            <Text style={[styles.title, { color: palette.text }]}>Live rates → ₹ (INR)</Text>
            <Text style={[styles.time, { color: palette.textFaint }]}>
              {updated ? `Updated ${updated.toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit' })}` : ''}
            </Text>
          </View>
        </View>
        <Pressable onPress={load} hitSlop={8}>
          <Ionicons name="refresh" size={18} color={palette.textMuted} />
        </Pressable>
      </View>

      {rates.map((r, i) => (
        <View key={r.code} style={[styles.row, i > 0 && { borderTopColor: palette.border, borderTopWidth: StyleSheet.hairlineWidth }]}>
          <View style={[styles.badge, { backgroundColor: palette.surfaceAlt }]}>
            <Text style={[styles.badgeText, { color: palette.text }]}>{r.symbol}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.code, { color: palette.text }]}>1 {r.code}</Text>
            <Text style={[styles.name, { color: palette.textMuted }]}>{r.name}</Text>
          </View>
          <Text style={[styles.value, { color: palette.text }]}>{formatINR(r.inr)}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { marginHorizontal: 20, marginTop: 6, marginBottom: 4, borderRadius: 18, borderWidth: StyleSheet.hairlineWidth, padding: 16, minHeight: 70, justifyContent: 'center' },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  icon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  time: { fontSize: 11, marginTop: 1 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  badge: { width: 38, height: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontSize: 15, fontWeight: '800' },
  code: { fontSize: 15, fontWeight: '700' },
  name: { fontSize: 12, marginTop: 2 },
  value: { fontSize: 16, fontWeight: '800', letterSpacing: -0.3 },
});
