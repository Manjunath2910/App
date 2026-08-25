// ─── FullArticle — in-app full story reader (opens on card tap) ───────────────
// Inshorts-style: clean hero, category tag, headline, "short by {author} /
// {time} on {date}" meta, lead, body, read-at-source CTA, text-size control,
// and a "More stories" related list.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ARTICLES, timeAgo } from '@/data/news';
import { useApp } from '@/store/app';
import { openUrl } from '@/utils/openUrl';
import { shareStory } from '@/utils/share';

function metaLine(iso: string) {
  const d = new Date(iso);
  const now = Number.isNaN(d.getTime()) ? new Date() : d;
  const time = now
    .toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
    .toLowerCase();
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const date = now.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  return `${time} on ${weekday}, ${date}`;
}

export default function FullArticle() {
  const { palette, isDark, article, openArticle, closeArticle, isBookmarked, toggleBookmark, fontScale, cycleFontScale, speak, stopSpeak, speakingId, isLiked, toggleLike } =
    useApp();
  const insets = useSafeAreaInsets();
  const visible = Boolean(article);
  const saved = article ? isBookmarked(article.id) : false;
  const liked = article ? isLiked(article.id) : false;
  const listening = article ? speakingId === article.id : false;

  const openSource = () => {
    if (!article) return;
    const isPlaceholder = !article.url || /example\.com/i.test(article.url);
    const target = isPlaceholder
      ? `https://news.google.com/search?q=${encodeURIComponent(article.title)}`
      : article.url;
    openUrl(target);
  };
  const share = () => article && shareStory(article.title, article.url);

  const headline = isDark ? palette.text : '#1F1F26';
  const bodyText = isDark ? palette.textMuted : '#3E3E46';
  const fs = fontScale;

  const related = article
    ? ARTICLES.filter((a) => a.category === article.category && a.id !== article.id).slice(0, 4)
    : [];

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={closeArticle} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: palette.card }}>
        {/* Top bar */}
        <View style={[styles.topBar, { paddingTop: insets.top + 6, backgroundColor: palette.card, borderBottomColor: palette.border }]}>
          <Pressable onPress={() => { stopSpeak(); closeArticle(); }} hitSlop={10} style={styles.iconBtn}>
            <Ionicons name="chevron-down" size={24} color={palette.text} />
          </Pressable>
          <View style={styles.topActions}>
            <Pressable onPress={() => (article ? (listening ? stopSpeak() : speak(article)) : null)} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name={listening ? 'stop-circle' : 'volume-high-outline'} size={21} color={listening ? palette.accent : palette.text} />
            </Pressable>
            <Pressable onPress={cycleFontScale} hitSlop={10} style={styles.iconBtn}>
              <Text style={[styles.aa, { color: palette.text }]}>A</Text>
              <Text style={[styles.aaSmall, { color: palette.text }]}>a</Text>
            </Pressable>
            <Pressable onPress={() => article && toggleLike(article)} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name={liked ? 'heart' : 'heart-outline'} size={20} color={liked ? '#F43F5E' : palette.text} />
            </Pressable>
            <Pressable onPress={() => article && toggleBookmark(article)} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name={saved ? 'bookmark' : 'bookmark-outline'} size={20} color={saved ? palette.accent : palette.text} />
            </Pressable>
            <Pressable onPress={share} hitSlop={10} style={styles.iconBtn}>
              <Ionicons name="share-social-outline" size={20} color={palette.text} />
            </Pressable>
          </View>
        </View>

        {article && (
          <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
            {/* Hero image (clean) — play button for video news */}
            <View style={{ height: 240, backgroundColor: palette.imgPlaceholder }}>
              <Image source={{ uri: article.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" transition={200} />
              {article.videoUrl && (
                <Pressable style={styles.playWrap} onPress={() => openUrl(article.videoUrl!)} hitSlop={10}>
                  <View style={styles.playCircle}>
                    <Ionicons name="play" size={32} color="#fff" style={{ marginLeft: 3 }} />
                  </View>
                </Pressable>
              )}
            </View>

            {/* Article body */}
            <View style={styles.body}>
              <View style={[styles.tag, { backgroundColor: article.accent }]}>
                <Text style={styles.tagText}>{article.category.toUpperCase()}</Text>
              </View>

              <Text style={[styles.title, { color: headline, fontSize: 25 * fs, lineHeight: 32 * fs }]}>{article.title}</Text>

              <Text style={[styles.meta, { color: palette.textMuted }]}>
                <Text style={{ fontWeight: '700', color: headline }}>short </Text>
                by {article.author} / {metaLine(article.publishedAt)}
              </Text>

              <Text style={[styles.lead, { color: bodyText, fontSize: 17 * fs, lineHeight: 27 * fs }]}>{article.summary}</Text>

              {article.content && article.content !== article.summary && (
                <>
                  <View style={[styles.rule, { backgroundColor: palette.border }]} />
                  <Text style={[styles.content, { color: bodyText, fontSize: 16 * fs, lineHeight: 26 * fs }]}>{article.content}</Text>
                </>
              )}

              {/* Read at source */}
              <Pressable onPress={openSource} style={[styles.sourceBtn, { backgroundColor: article.accent }]}>
                <Ionicons name="globe-outline" size={18} color="#fff" />
                <Text style={styles.sourceText}>read more at {article.source}</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" style={{ marginLeft: 'auto' }} />
              </Pressable>

              {/* More stories (related) */}
              {related.length > 0 && (
                <View style={styles.more}>
                  <Text style={[styles.moreTitle, { color: palette.text }]}>More stories</Text>
                  {related.map((item) => (
                    <Pressable key={item.id} onPress={() => openArticle(item)} style={[styles.moreRow, { borderTopColor: palette.border }]}>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.moreHeadline, { color: palette.text }]} numberOfLines={2}>
                          {item.title}
                        </Text>
                        <Text style={[styles.moreMeta, { color: palette.textMuted }]}>
                          {item.source} · {timeAgo(item.publishedAt)}
                        </Text>
                      </View>
                      <Image source={{ uri: item.imageUrl }} style={styles.moreThumb} contentFit="cover" />
                    </Pressable>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingBottom: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topActions: { flexDirection: 'row', gap: 4, alignItems: 'center' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  aa: { fontSize: 18, fontWeight: '800' },
  aaSmall: { fontSize: 13, fontWeight: '800', marginTop: 4 },
  playWrap: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playCircle: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  body: { paddingHorizontal: 22, paddingTop: 18 },
  tag: { alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tagText: { color: '#fff', fontSize: 10.5, fontWeight: '800', letterSpacing: 0.7 },
  title: { fontWeight: '800', letterSpacing: -0.4, marginTop: 14 },
  meta: { fontSize: 12.5, marginTop: 10, lineHeight: 18 },
  lead: { marginTop: 18, fontWeight: '500' },
  rule: { height: StyleSheet.hairlineWidth, marginVertical: 20 },
  content: {},
  loadingFull: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 14 },
  loadingFullText: { fontSize: 13.5, fontWeight: '600' },
  sourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    marginTop: 28,
    paddingHorizontal: 18,
    paddingVertical: 15,
    borderRadius: 14,
  },
  sourceText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  more: { marginTop: 30 },
  moreTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3, marginBottom: 6 },
  moreRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, borderTopWidth: StyleSheet.hairlineWidth },
  moreHeadline: { fontSize: 15, fontWeight: '700', lineHeight: 21 },
  moreMeta: { fontSize: 12, marginTop: 5 },
  moreThumb: { width: 74, height: 74, borderRadius: 12, backgroundColor: '#0002' },
});
