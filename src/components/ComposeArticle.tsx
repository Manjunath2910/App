// ─── ComposeArticle — write & publish your own story (saved on device) ────────
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CATEGORIES, type Category } from '@/data/news';
import { ACCENTS, fallbackImage } from '@/data/liveFeeds';
import { useApp } from '@/store/app';

type Props = { visible: boolean; onClose: () => void };
const TOPICS = CATEGORIES.filter((c) => c !== 'All') as Exclude<Category, 'All'>[];

export default function ComposeArticle({ visible, onClose }: Props) {
  const { palette, addPost, user } = useApp();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [author, setAuthor] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [cat, setCat] = useState<Exclude<Category, 'All'>>('Digital');

  const canPost = title.trim().length > 4 && summary.trim().length > 10;

  const publish = () => {
    if (!canPost) return;
    addPost({
      id: `post-${Date.now()}`,
      category: cat,
      title: title.trim(),
      summary: summary.trim(),
      content: content.trim() || summary.trim(),
      imageUrl: imageUrl.trim() || fallbackImage(cat),
      source: 'Mini Shorts',
      author: author.trim() || user?.name || 'You',
      url: '',
      publishedAt: new Date().toISOString(),
      accent: ACCENTS[cat] || '#E11D48',
    });
    reset();
    onClose();
  };
  const reset = () => {
    setTitle('');
    setSummary('');
    setContent('');
    setAuthor('');
    setImageUrl('');
    setCat('Digital');
  };
  const cancel = () => {
    reset();
    onClose();
  };

  const input = (label: string, value: string, set: (v: string) => void, opts?: { multiline?: boolean; placeholder?: string; hint?: string }) => (
    <View style={{ marginBottom: 16 }}>
      <Text style={[styles.label, { color: palette.textMuted }]}>{label}{opts?.hint ? <Text style={{ color: palette.textFaint }}> · {opts.hint}</Text> : null}</Text>
      <TextInput
        value={value}
        onChangeText={set}
        placeholder={opts?.placeholder}
        placeholderTextColor={palette.textFaint}
        multiline={opts?.multiline}
        style={[
          styles.input,
          opts?.multiline && { height: 110, textAlignVertical: 'top', paddingTop: 12 },
          { backgroundColor: palette.surfaceAlt, borderColor: palette.border, color: palette.text },
        ]}
      />
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: palette.card, paddingTop: insets.top + 6 }]}>
        <View style={[styles.topBar, { borderBottomColor: palette.border }]}>
          <Pressable onPress={cancel} hitSlop={10}>
            <Text style={[styles.cancel, { color: palette.textMuted }]}>Cancel</Text>
          </Pressable>
          <Text style={[styles.topTitle, { color: palette.text }]}>Post an article</Text>
          <Pressable onPress={publish} disabled={!canPost} hitSlop={10}>
            <Text style={[styles.publish, { color: canPost ? palette.accent : palette.textFaint }]}>Publish</Text>
          </Pressable>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: insets.bottom + 30 }} keyboardShouldPersistTaps="handled">
          {input('Headline', title, setTitle, { placeholder: 'Your headline' })}

          <Text style={[styles.label, { color: palette.textMuted }]}>Category</Text>
          <View style={styles.cats}>
            {TOPICS.map((c) => {
              const on = c === cat;
              return (
                <Pressable
                  key={c}
                  onPress={() => setCat(c)}
                  style={[styles.chip, on ? { backgroundColor: palette.accent } : { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
                  <Text style={[styles.chipText, { color: on ? '#fff' : palette.text }]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
          <View style={{ height: 16 }} />

          {input('Summary', summary, setSummary, { multiline: true, hint: 'about 60 words', placeholder: 'The short card text…' })}
          {input('Full story', content, setContent, { multiline: true, hint: 'optional', placeholder: 'The full article shown when tapped…' })}
          {input('Image URL', imageUrl, setImageUrl, { hint: 'optional', placeholder: 'https://…jpg' })}
          {input('Author', author, setAuthor, { hint: 'optional', placeholder: 'Your name' })}

          <Pressable onPress={publish} disabled={!canPost} style={[styles.cta, { backgroundColor: canPost ? palette.accent : palette.surfaceAlt }]}>
            <Ionicons name="send" size={17} color={canPost ? '#fff' : palette.textFaint} />
            <Text style={[styles.ctaText, { color: canPost ? '#fff' : palette.textFaint }]}>Publish to feed</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  cancel: { fontSize: 15.5, fontWeight: '600' },
  topTitle: { fontSize: 16, fontWeight: '800' },
  publish: { fontSize: 15.5, fontWeight: '800' },
  label: { fontSize: 12.5, fontWeight: '700', marginBottom: 7 },
  input: { minHeight: 48, borderRadius: 12, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, fontSize: 15.5 },
  cats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999 },
  chipText: { fontSize: 13, fontWeight: '700' },
  cta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 52, borderRadius: 14, marginTop: 10 },
  ctaText: { fontSize: 16, fontWeight: '800' },
});
