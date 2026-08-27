// ─── NewsCard — matches the Inshorts full-screen card, line for line ──────────
// Layout (top → bottom): full-bleed image · headline · "short by {author} /
// {time} on {date}" meta · 60-word body · "read more at {source}" footer bar.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type Article } from '@/data/news';
import { useApp } from '@/store/app';
import { openUrl } from '@/utils/openUrl';
import { shareStory } from '@/utils/share';

type Props = { article: Article; height: number };

// "Friday, 14 August 2026"  ·  "10:48 am"
function inshortsMeta(iso: string) {
  const d = new Date(iso);
  const valid = !Number.isNaN(d.getTime());
  const now = valid ? d : new Date();
  const time = now
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return { time, date: `${weekday}, ${date}` };
}

export default function NewsCard({ article, height }: Props) {
  const { palette, isDark, isBookmarked, toggleBookmark, openArticle, speak, stopSpeak, speakingId, isLiked, toggleLike } = useApp();
  const saved = isBookmarked(article.id);
  const liked = isLiked(article.id);
  const listening = speakingId === article.id;
  const imageHeight = Math.round(height * 0.37); // smaller image → more room for description
  const { time, date } = inshortsMeta(article.publishedAt);

  const openFull = () => openArticle(article);
  const share = () => shareStory(article.title, article.url);

  // Inshorts uses a soft slate for headline & body on white.
  const headline = isDark ? palette.text : '#2B2B33';
  const bodyText = isDark ? palette.textMuted : '#4A4A52';
  const metaText = isDark ? palette.textFaint : '#8A8A93';
  const footerBg = isDark ? palette.surface : '#F4F4F6';

  return (
    <View style={[styles.card, { height, backgroundColor: palette.card }]}>
      {/* ── Hero image (clean, full-bleed) — tap play to watch video news ── */}
      <View style={{ height: imageHeight, backgroundColor: palette.imgPlaceholder }}>
        <Image source={{ uri: article.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
        {article.videoUrl && (
          <Pressable style={styles.playWrap} onPress={() => openUrl(article.videoUrl!)} hitSlop={10}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={30} color="#fff" style={{ marginLeft: 3 }} />
            </View>
          </Pressable>
        )}

        {/* App-name badge (bottom-left of the image) — real app icon + name */}
        <View style={styles.brandBadge}>
          <Image source={require('../../assets/images/icon.png')} style={styles.brandIcon} contentFit="cover" />
          <Text style={styles.brandName}>Mini Shorts</Text>
        </View>
      </View>

      {/* ── Body (tap anywhere to read the full story) ── */}
      <Pressable style={({ pressed }) => [styles.body, pressed && { opacity: 0.96 }]} onPress={openFull}>
        <Text style={[styles.title, { color: headline }]} numberOfLines={3}>
          {article.title}
        </Text>

        {/* meta: short by {author} / {time} on {date} */}
        <Text style={[styles.meta, { color: metaText }]} numberOfLines={2}>
          <Text style={[styles.metaShort, { color: isDark ? palette.text : '#2B2B33' }]}>short </Text>
          by {article.author} / {time} on {date}
        </Text>

        <Text style={[styles.summary, { color: bodyText }]}>{article.summary}</Text>
        <View style={styles.swipeHint}>
          <Ionicons name="chevron-up" size={13} color={metaText} />
          <Text style={[styles.swipeText, { color: metaText }]}>swipe up for next</Text>
        </View>
      </Pressable>

      {/* ── Footer: read more + actions ── */}
      <Pressable
        onPress={openFull}
        style={[styles.footer, { backgroundColor: footerBg, borderTopColor: palette.border }]}>
        <Text style={[styles.readMore, { color: metaText }]} numberOfLines={1}>
          read more at <Text style={{ color: article.accent, fontWeight: '700' }}>{article.source}</Text>
        </Text>
        <View style={styles.footerActions}>
          <Pressable hitSlop={10} onPress={() => toggleLike(article)} style={styles.iconBtn}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#F43F5E' : metaText} />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => (listening ? stopSpeak() : speak(article))} style={styles.iconBtn}>
            <Ionicons
              name={listening ? 'stop-circle' : 'volume-high-outline'}
              size={21}
              color={listening ? article.accent : metaText}
            />
          </Pressable>
          <Pressable hitSlop={10} onPress={() => toggleBookmark(article)} style={styles.iconBtn}>
            <Ionicons
              name={saved ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={saved ? article.accent : metaText}
            />
          </Pressable>
          <Pressable hitSlop={10} onPress={share} style={styles.iconBtn}>
            <Ionicons name="share-social-outline" size={20} color={metaText} />
          </Pressable>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { width: '100%', overflow: 'hidden' },
  playWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  brandBadge: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.94)',
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  brandIcon: { width: 18, height: 18, borderRadius: 5 },
  brandName: { color: '#1F1F26', fontSize: 12.5, fontWeight: '800', letterSpacing: -0.2 },
  body: { flex: 1, paddingHorizontal: 22, paddingTop: 16, paddingBottom: 8, overflow: 'hidden' },
  title: { fontSize: 23, fontWeight: '700', lineHeight: 30, letterSpacing: -0.3 },
  meta: { fontSize: 12, marginTop: 8, lineHeight: 17 },
  metaShort: { fontWeight: '700', fontSize: 12 },
  summary: { flex: 1, fontSize: 16, lineHeight: 24, marginTop: 12 },
  swipeHint: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 10, opacity: 0.6 },
  swipeText: { fontSize: 11.5, fontWeight: '600', letterSpacing: 0.2 },
  footer: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  readMore: { fontSize: 13.5, flex: 1 },
  footerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
});
