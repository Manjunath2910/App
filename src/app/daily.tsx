// ─── Daily — intro (Daily Ritual) → today's top picks + reminder ──────────────
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import SignIn from '@/components/SignIn';
import { ARTICLES, timeAgo, type Article } from '@/data/news';
import { fetchNews } from '@/data/remote';
import { useT } from '@/i18n';
import { useApp } from '@/store/app';
import { disableDailyReminder, enableDailyReminder } from '@/utils/notify';

const STARTED_KEY = 'mb:dailyStarted';
const ICON = require('../../assets/images/icon.png');

export default function Daily() {
  const { palette, openArticle, reminderOn, setReminderOn } = useApp();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [live, setLive] = useState<Article[] | null>(null);
  const [started, setStarted] = useState<boolean | null>(null);
  const [phase, setPhase] = useState<'intro' | 'questions' | 'age' | 'gender' | 'topics' | 'name' | 'city'>('intro');
  const [reason, setReason] = useState<number | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [gender, setGender] = useState<number | null>(null);
  const [topics, setTopics] = useState<number[]>([]);
  const [others, setOthers] = useState('');
  const [name, setName] = useState('');
  const [city, setCity] = useState<number | null>(null);
  const [cityOther, setCityOther] = useState('');
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STARTED_KEY).then((v) => setStarted(v === '1'));
    fetchNews().then((a) => a.length && setLive(a));
  }, []);

  const start = () => setPhase('questions');
  const finish = () => {
    setStarted(true);
    AsyncStorage.setItem(STARTED_KEY, '1').catch(() => {});
  };

  const onToggleReminder = async (v: boolean) => {
    try {
      if (v) setReminderOn(await enableDailyReminder());
      else {
        await disableDailyReminder();
        setReminderOn(false);
      }
    } catch {
      setReminderOn(v);
    }
  };

  const picks = useMemo(() => (live ?? ARTICLES).slice(0, 10), [live]);

  if (started === null) {
    return (
      <View style={[styles.root, { backgroundColor: palette.bg, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={palette.accent} />
      </View>
    );
  }

  // ── Questions step (after tapping Start) ──
  if (!started && phase === 'questions') {
    const REASONS: { icon: keyof typeof Ionicons.glyphMap; label: string }[] = [
      { icon: 'newspaper-outline', label: 'To stay informed daily' },
      { icon: 'book-outline', label: 'To build a reading habit' },
      { icon: 'sparkles-outline', label: 'To simplify news' },
      { icon: 'time-outline', label: 'To save time by reading important updates in one place' },
    ];
    return (
      <View style={[styles.introRoot, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
        <View style={[styles.introCard, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.blob, styles.blob1, { backgroundColor: palette.accent }]} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <Text style={[styles.qIntro, { color: palette.textMuted }]}>A few questions to help us shape your daily experience</Text>
            <Text style={[styles.qTitle, { color: palette.text }]}>Why do you want to start Daily Digest?</Text>

            {REASONS.map((r, i) => {
              const on = reason === i;
              return (
                <Pressable
                  key={i}
                  onPress={() => setReason(i)}
                  style={[
                    styles.opt,
                    { backgroundColor: palette.card, borderColor: on ? palette.accent : palette.border, borderWidth: on ? 2 : StyleSheet.hairlineWidth },
                  ]}>
                  <View style={[styles.optIcon, { backgroundColor: on ? palette.accent : palette.accentSoft }]}>
                    <Ionicons name={r.icon} size={22} color={on ? '#fff' : palette.accent} />
                  </View>
                  <Text style={[styles.optLabel, { color: palette.text }]}>{r.label}</Text>
                  {on && <Ionicons name="checkmark-circle" size={22} color={palette.accent} style={{ marginLeft: 'auto' }} />}
                </Pressable>
              );
            })}

            <Pressable
              onPress={() => setPhase('age')}
              disabled={reason === null}
              style={[styles.nextBtn, { backgroundColor: reason === null ? palette.surfaceAlt : palette.accent }]}>
              <Text style={[styles.nextText, { color: reason === null ? palette.textFaint : '#fff' }]}>Next</Text>
              <Ionicons name="chevron-forward" size={18} color={reason === null ? palette.textFaint : '#fff'} />
            </Pressable>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Age bucket step ──
  if (!started && phase === 'age') {
    const AGES = ['Less than 18 yrs', '18-25 yrs', '26-30 yrs', '31-35 yrs', '36-40 yrs', '41-50 yrs', '50+ yrs'];
    const faces: { icon: keyof typeof Ionicons.glyphMap; tint: string; rot: string }[] = [
      { icon: 'happy-outline', tint: '#F59E0B', rot: '-8deg' },
      { icon: 'person-outline', tint: '#E11D48', rot: '-3deg' },
      { icon: 'person-circle-outline', tint: '#6366F1', rot: '3deg' },
      { icon: 'happy-outline', tint: '#10B981', rot: '8deg' },
    ];
    return (
      <View style={[styles.introRoot, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
        <View style={[styles.introCard, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.blob, styles.blob2, { backgroundColor: palette.accent }]} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            <Text style={[styles.qTitle, { color: palette.text, marginTop: 20 }]}>
              Help us tailor your experience — which age group do you belong to?
            </Text>

            {/* Decorative avatar tiles */}
            <View style={styles.faces}>
              {faces.map((f, i) => (
                <View key={i} style={[styles.face, { backgroundColor: palette.card, transform: [{ rotate: f.rot }] }]}>
                  <Ionicons name={f.icon} size={30} color={f.tint} />
                </View>
              ))}
            </View>

            <View style={styles.ageWrap}>
              {AGES.map((label, i) => {
                const on = age === i;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setAge(i)}
                    style={[
                      styles.ageChip,
                      { backgroundColor: palette.card, borderColor: on ? palette.accent : palette.border, borderWidth: on ? 2 : StyleSheet.hairlineWidth },
                    ]}>
                    <Text style={[styles.ageText, { color: on ? palette.accent : palette.text }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.navRow}>
              <Pressable onPress={() => setPhase('questions')} style={[styles.backBtn, { backgroundColor: palette.accent }]}>
                <Ionicons name="chevron-back" size={18} color="#fff" />
                <Text style={styles.navText}>Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setPhase('gender')}
                disabled={age === null}
                style={[styles.backBtn, { backgroundColor: age === null ? palette.surfaceAlt : palette.accent }]}>
                <Text style={[styles.navText, { color: age === null ? palette.textFaint : '#fff' }]}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color={age === null ? palette.textFaint : '#fff'} />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Gender step ──
  if (!started && phase === 'gender') {
    const GENDERS = ['Male', 'Female', 'Others'];
    const faces: { icon: keyof typeof Ionicons.glyphMap; tint: string; rot: string }[] = [
      { icon: 'man-outline', tint: '#E11D48', rot: '-6deg' },
      { icon: 'woman-outline', tint: '#F59E0B', rot: '0deg' },
      { icon: 'person-outline', tint: '#6366F1', rot: '6deg' },
    ];
    return (
      <View style={[styles.introRoot, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
        <View style={[styles.introCard, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.blob, styles.blob1, { backgroundColor: palette.accent }]} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            <Text style={[styles.qTitle, { color: palette.text, marginTop: 20 }]}>How do you identify yourself?</Text>

            <View style={styles.faces}>
              {faces.map((f, i) => (
                <View key={i} style={[styles.face, { backgroundColor: palette.card, transform: [{ rotate: f.rot }] }]}>
                  <Ionicons name={f.icon} size={30} color={f.tint} />
                </View>
              ))}
            </View>

            <View style={styles.genderWrap}>
              {GENDERS.map((label, i) => {
                const on = gender === i;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setGender(i)}
                    style={[
                      styles.genderChip,
                      { backgroundColor: palette.card, borderColor: on ? palette.accent : palette.border, borderWidth: on ? 2 : StyleSheet.hairlineWidth },
                    ]}>
                    <Text style={[styles.ageText, { color: on ? palette.accent : palette.text }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <View style={styles.navRow}>
              <Pressable onPress={() => setPhase('age')} style={[styles.backBtn, { backgroundColor: palette.accent }]}>
                <Ionicons name="chevron-back" size={18} color="#fff" />
                <Text style={styles.navText}>Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setPhase('topics')}
                disabled={gender === null}
                style={[styles.backBtn, { backgroundColor: gender === null ? palette.surfaceAlt : palette.accent }]}>
                <Text style={[styles.navText, { color: gender === null ? palette.textFaint : '#fff' }]}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color={gender === null ? palette.textFaint : '#fff'} />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Topics step ──
  if (!started && phase === 'topics') {
    const TOPICS: { icon: keyof typeof Ionicons.glyphMap; label: string; tint: string }[] = [
      { icon: 'play', label: 'Informative Videos', tint: '#3B82F6' },
      { icon: 'hardware-chip-outline', label: 'AI News', tint: '#6366F1' },
      { icon: 'briefcase-outline', label: 'Business & Finance', tint: '#16A34A' },
      { icon: 'baseball-outline', label: 'Sports News', tint: '#0EA5E9' },
      { icon: 'earth', label: 'World Affairs', tint: '#10B981' },
    ];
    const canSubmit = topics.length > 0 || others.trim().length > 0;
    const toggleTopic = (i: number) => setTopics((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i]));
    return (
      <View style={[styles.introRoot, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
        <View style={[styles.introCard, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.blob, styles.blob2, { backgroundColor: palette.accent }]} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}>
            <Text style={[styles.qTitle, { color: palette.text, marginTop: 20 }]}>Pick topic(s) you care about</Text>

            <View style={styles.topicGrid}>
              {TOPICS.map((tp, i) => {
                const on = topics.includes(i);
                return (
                  <Pressable
                    key={tp.label}
                    onPress={() => toggleTopic(i)}
                    style={[
                      styles.topicCard,
                      { backgroundColor: palette.card, borderColor: on ? palette.accent : palette.border, borderWidth: on ? 2 : StyleSheet.hairlineWidth },
                    ]}>
                    <View style={[styles.topicIcon, { backgroundColor: tp.tint + '22' }]}>
                      <Ionicons name={tp.icon} size={30} color={tp.tint} />
                    </View>
                    <Text style={[styles.topicLabel, { color: palette.text }]} numberOfLines={2}>{tp.label}</Text>
                    {on && <Ionicons name="checkmark-circle" size={18} color={palette.accent} style={styles.topicCheck} />}
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={others}
              onChangeText={setOthers}
              placeholder="Others (Please specify)"
              placeholderTextColor={palette.textFaint}
              style={[styles.othersInput, { backgroundColor: palette.card, borderColor: palette.border, color: palette.text }]}
            />

            <View style={styles.navRow}>
              <Pressable onPress={() => setPhase('gender')} style={[styles.backBtn, { backgroundColor: palette.accent }]}>
                <Ionicons name="chevron-back" size={18} color="#fff" />
                <Text style={styles.navText}>Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setPhase('name')}
                disabled={!canSubmit}
                style={[styles.backBtn, { backgroundColor: canSubmit ? palette.accent : palette.surfaceAlt }]}>
                <Text style={[styles.navText, { color: canSubmit ? '#fff' : palette.textFaint }]}>Submit & Next</Text>
                <Ionicons name="chevron-forward" size={18} color={canSubmit ? '#fff' : palette.textFaint} />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── Name step ──
  if (!started && phase === 'name') {
    const nameOk = name.trim().length > 1;
    const submitName = () => {
      AsyncStorage.setItem('mb:name', name.trim()).catch(() => {});
      finish();
    };
    return (
      <View style={[styles.introRoot, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
        <View style={[styles.introCard, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.blob, styles.blob1, { backgroundColor: palette.accent }]} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
            {/* ID-card illustration */}
            <View style={styles.idWrap}>
              <View style={[styles.idCard, { backgroundColor: palette.card }]}>
                <View style={[styles.idPhoto, { backgroundColor: palette.accentSoft }]}>
                  <Ionicons name="person" size={34} color={palette.accent} />
                </View>
                <View style={{ flex: 1, gap: 7 }}>
                  <View style={[styles.idLine, { backgroundColor: palette.border, width: '80%' }]} />
                  <View style={[styles.idLine, { backgroundColor: palette.border, width: '55%' }]} />
                </View>
                <Ionicons name="heart" size={22} color={palette.accent} style={styles.idHeart} />
              </View>
            </View>

            <Text style={[styles.qTitle, { color: palette.text, marginTop: 4 }]}>Please tell us your name.</Text>
            <Text style={[styles.qIntro, { color: palette.textMuted, marginTop: 0 }]}>
              We'll use this to personalise your share cards and feature you on the Daily leaderboard.
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={palette.textFaint}
              style={[styles.othersInput, { backgroundColor: palette.card, borderColor: palette.border, color: palette.text, marginTop: 24 }]}
              returnKeyType="done"
              onSubmitEditing={() => nameOk && submitName()}
            />

            <View style={styles.navRow}>
              <Pressable onPress={() => setPhase('topics')} style={[styles.backBtn, { backgroundColor: palette.accent }]}>
                <Ionicons name="chevron-back" size={18} color="#fff" />
                <Text style={styles.navText}>Back</Text>
              </Pressable>
              <Pressable
                onPress={() => setPhase('city')}
                disabled={!nameOk}
                style={[styles.backBtn, { backgroundColor: nameOk ? palette.accent : palette.surfaceAlt }]}>
                <Text style={[styles.navText, { color: nameOk ? '#fff' : palette.textFaint }]}>Next</Text>
                <Ionicons name="chevron-forward" size={18} color={nameOk ? '#fff' : palette.textFaint} />
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    );
  }

  // ── City step (final) ──
  if (!started && phase === 'city') {
    const CITIES = ['Bangalore', 'Chennai', 'Delhi', 'Gurugram', 'Hyderabad', 'Jaipur', 'Kolkata', 'Mumbai', 'Noida', 'Pune'];
    const cityOk = city !== null || cityOther.trim().length > 0;
    const loginAndStart = () => {
      const chosen = city !== null ? CITIES[city] : cityOther.trim();
      AsyncStorage.setItem('mb:city', chosen).catch(() => {});
      setShowSignIn(true); // open sign-in; onSuccess starts the ritual
    };
    return (
      <View style={[styles.introRoot, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
        <View style={[styles.introCard, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.blob, styles.blob1, { backgroundColor: palette.accent }]} />
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
            <Text style={[styles.qTitle, { color: palette.text, marginTop: 20 }]}>
              Tell us your city so we can feature you on city-wise leaderboards.
            </Text>

            {/* Skyline illustration */}
            <View style={styles.cityWrap}>
              <Ionicons name="location" size={30} color={palette.accent} style={{ marginBottom: -8, zIndex: 2 }} />
              <View style={styles.skyline}>
                <Ionicons name="business" size={38} color="#3B82F6" />
                <Ionicons name="business" size={48} color="#6366F1" />
                <Ionicons name="home" size={30} color="#10B981" />
                <Ionicons name="business-outline" size={34} color="#F59E0B" />
              </View>
            </View>

            <View style={styles.cityGrid}>
              {CITIES.map((label, i) => {
                const on = city === i;
                return (
                  <Pressable
                    key={label}
                    onPress={() => setCity(i)}
                    style={[
                      styles.cityChip,
                      { backgroundColor: palette.card, borderColor: on ? palette.accent : palette.border, borderWidth: on ? 2 : StyleSheet.hairlineWidth },
                    ]}>
                    <Text style={[styles.ageText, { color: on ? palette.accent : palette.text }]}>{label}</Text>
                  </Pressable>
                );
              })}
            </View>

            <TextInput
              value={cityOther}
              onChangeText={(v) => {
                setCityOther(v);
                if (v) setCity(null);
              }}
              placeholder="Others [Type Here…]"
              placeholderTextColor={palette.textFaint}
              style={[styles.othersInput, { backgroundColor: palette.card, borderColor: palette.border, color: palette.text }]}
            />

            <View style={styles.navRow}>
              <Pressable onPress={() => setPhase('name')} style={[styles.backBtn, { backgroundColor: palette.accent }]}>
                <Ionicons name="chevron-back" size={18} color="#fff" />
                <Text style={styles.navText}>Back</Text>
              </Pressable>
              <Pressable
                onPress={loginAndStart}
                disabled={!cityOk}
                style={[styles.backBtn, { backgroundColor: cityOk ? palette.accent : palette.surfaceAlt }]}>
                <Text style={[styles.navText, { color: cityOk ? '#fff' : palette.textFaint }]}>Login & Start Ritual</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        <SignIn visible={showSignIn} onClose={() => setShowSignIn(false)} onSuccess={finish} />
      </View>
    );
  }

  // ── Intro (Daily Ritual welcome) ──
  if (!started) {
    return (
      <View style={[styles.introRoot, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
        <View style={[styles.introCard, { backgroundColor: palette.accentSoft }]}>
          <View style={[styles.blob, styles.blob1, { backgroundColor: palette.accent }]} />
          <View style={[styles.blob, styles.blob2, { backgroundColor: palette.accent }]} />

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}>
            <View style={styles.welcomeRow}>
              <Text style={[styles.welcome, { color: palette.text }]}>Welcome to</Text>
              <Image source={ICON} style={styles.welcomeIcon} contentFit="cover" />
              <Text style={[styles.welcomeBrand, { color: palette.text }]}>Mini Shorts</Text>
            </View>
            <Text style={[styles.bigTitle, { color: palette.accent }]}>DAILY DIGEST</Text>
            <Text style={[styles.introSub, { color: palette.text }]}>
              Designed to turn staying informed into a <Text style={{ color: palette.accent, fontWeight: '800' }}>daily habit.</Text>
            </Text>

            <Step
              n="Step 1"
              icon="newspaper-outline"
              title="Read today's news"
              desc="The top marketing & market stories that matter, in one place."
              palette={palette}
            />
            <Step
              n="Step 2"
              icon="flame"
              title="Build your streak"
              desc="Read every day and keep your streak alive."
              palette={palette}
            />

            <View style={[styles.proof, { borderColor: palette.border }]}>
              <Ionicons name="people" size={20} color={palette.accent} />
              <Text style={[styles.proofText, { color: palette.textMuted }]}>
                Thousands of readers make <Text style={{ color: palette.accent, fontWeight: '800' }}>Daily Digest</Text> their everyday habit.
              </Text>
            </View>

            <Pressable onPress={start} style={styles.ctaWrap}>
              <LinearGradient colors={[palette.accent, '#B3153A']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.cta}>
                <Text style={styles.ctaText}>Tap here to start</Text>
              </LinearGradient>
            </Pressable>

            <View style={styles.loginRow}>
              <Text style={[styles.loginQ, { color: palette.textMuted }]}>Are you an existing user?</Text>
              <Pressable onPress={() => setShowSignIn(true)}>
                <Text style={[styles.loginLink, { color: palette.accent }]}>Tap here to login</Text>
              </Pressable>
            </View>
          </ScrollView>
        </View>

        <SignIn visible={showSignIn} onClose={() => setShowSignIn(false)} onSuccess={finish} />
      </View>
    );
  }

  // ── Digest ──
  const [lead, ...rest] = picks;
  const today = new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={[styles.root, { backgroundColor: palette.bg, paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 30 }}>
        <View style={styles.header}>
          <Text style={[styles.kicker, { color: palette.accent }]}>{today.toUpperCase()}</Text>
          <Text style={[styles.title, { color: palette.text }]}>{t('dailyDigest')}</Text>
          <Text style={[styles.sub, { color: palette.textMuted }]}>{t('todaysPicks')}</Text>
        </View>

        <View style={[styles.reminder, { backgroundColor: palette.card, borderColor: palette.border }]}>
          <View style={[styles.reminderIcon, { backgroundColor: palette.accentSoft }]}>
            <Ionicons name="notifications-outline" size={20} color={palette.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reminderTitle, { color: palette.text }]}>{t('dailyReminder')}</Text>
            <Text style={[styles.reminderDesc, { color: palette.textMuted }]}>{t('reminderDesc')}</Text>
          </View>
          <Switch value={reminderOn} onValueChange={onToggleReminder} trackColor={{ true: palette.accent, false: palette.surfaceAlt }} thumbColor="#fff" />
        </View>

        {lead && (
          <Pressable onPress={() => openArticle(lead)} style={[styles.lead, { backgroundColor: palette.imgPlaceholder }]}>
            <Image source={{ uri: lead.imageUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
            <View style={styles.leadShade} />
            <View style={[styles.leadChip, { backgroundColor: lead.accent }]}>
              <Text style={styles.leadChipText}>{lead.category.toUpperCase()}</Text>
            </View>
            <View style={styles.leadFooter}>
              <Text style={styles.leadTitle} numberOfLines={3}>{lead.title}</Text>
              <Text style={styles.leadMeta}>{lead.source} · {timeAgo(lead.publishedAt)}</Text>
            </View>
          </Pressable>
        )}

        <View style={{ paddingHorizontal: 18, marginTop: 8 }}>
          {rest.map((item, i) => (
            <Pressable key={item.id} onPress={() => openArticle(item)} style={[styles.row, { borderBottomColor: palette.border }]}>
              <Text style={[styles.rowNum, { color: palette.accent }]}>{String(i + 2).padStart(2, '0')}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: palette.text }]} numberOfLines={2}>{item.title}</Text>
                <Text style={[styles.rowMeta, { color: palette.textMuted }]}>{item.source} · {timeAgo(item.publishedAt)}</Text>
              </View>
              <Image source={{ uri: item.imageUrl }} style={styles.thumb} contentFit="cover" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

function Step({ n, icon, title, desc, palette }: { n: string; icon: keyof typeof Ionicons.glyphMap; title: string; desc: string; palette: any }) {
  return (
    <View style={styles.stepWrap}>
      <View style={[styles.stepBadge, { backgroundColor: palette.accentSoft }]}>
        <Text style={[styles.stepBadgeText, { color: palette.accent }]}>{n}</Text>
      </View>
      <View style={[styles.stepCard, { backgroundColor: palette.card }]}>
        <View style={[styles.stepIcon, { backgroundColor: palette.accentSoft }]}>
          <Ionicons name={icon} size={26} color={palette.accent} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.stepTitle, { color: palette.text }]}>{title}</Text>
          <Text style={[styles.stepDesc, { color: palette.textMuted }]}>{desc}</Text>
        </View>
      </View>
      <View style={[styles.stepEdge, { backgroundColor: palette.accent }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  // intro
  introRoot: { flex: 1 },
  introCard: { flex: 1, margin: 10, borderRadius: 26, overflow: 'hidden', paddingHorizontal: 22, paddingTop: 30 },
  blob: { position: 'absolute', borderRadius: 999, opacity: 0.12 },
  blob1: { width: 260, height: 260, right: -90, top: -60 },
  blob2: { width: 200, height: 200, left: -80, bottom: 40 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 10 },
  welcome: { fontSize: 16, fontWeight: '600' },
  welcomeIcon: { width: 22, height: 22, borderRadius: 6 },
  welcomeBrand: { fontSize: 16, fontWeight: '800' },
  bigTitle: { fontSize: 44, fontWeight: '900', letterSpacing: -1, textAlign: 'center', marginTop: 6 },
  introSub: { fontSize: 15.5, lineHeight: 22, textAlign: 'center', marginTop: 8, paddingHorizontal: 10 },
  stepWrap: { marginTop: 26, position: 'relative' },
  stepBadge: { position: 'absolute', top: -11, alignSelf: 'center', zIndex: 2, paddingHorizontal: 14, paddingVertical: 4, borderRadius: 999 },
  stepBadgeText: { fontSize: 12.5, fontWeight: '800' },
  stepCard: { flexDirection: 'row', alignItems: 'center', gap: 14, borderRadius: 18, padding: 18, paddingTop: 22 },
  stepIcon: { width: 62, height: 62, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  stepTitle: { fontSize: 18, fontWeight: '800', letterSpacing: -0.3 },
  stepDesc: { fontSize: 13.5, lineHeight: 19, marginTop: 4 },
  stepEdge: { height: 4, borderBottomLeftRadius: 18, borderBottomRightRadius: 18, marginHorizontal: 16, marginTop: -2 },
  proof: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 22, padding: 14, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth },
  proofText: { flex: 1, fontSize: 13, lineHeight: 19 },
  ctaWrap: { marginTop: 26 },
  cta: { height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  ctaText: { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 0.2 },
  loginRow: { alignItems: 'center', marginTop: 22, gap: 4 },
  loginQ: { fontSize: 13.5, fontWeight: '600' },
  loginLink: { fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
  // questions
  qIntro: { fontSize: 14.5, lineHeight: 21, textAlign: 'center', marginTop: 14, paddingHorizontal: 12 },
  qTitle: { fontSize: 20, fontWeight: '900', letterSpacing: -0.4, textAlign: 'center', marginTop: 14, marginBottom: 22 },
  opt: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, borderRadius: 16, marginBottom: 12 },
  optIcon: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  optLabel: { flex: 1, fontSize: 15, fontWeight: '700', lineHeight: 21 },
  nextBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, alignSelf: 'flex-end', paddingHorizontal: 26, height: 48, borderRadius: 13, marginTop: 16 },
  nextText: { fontSize: 16, fontWeight: '800' },
  // age step
  faces: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 18, marginBottom: 24 },
  face: { width: 64, height: 78, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginHorizontal: -6, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 6, shadowOffset: { width: 0, height: 3 }, elevation: 3 },
  ageWrap: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  ageChip: { paddingHorizontal: 16, paddingVertical: 11, borderRadius: 12 },
  ageText: { fontSize: 14, fontWeight: '700' },
  genderWrap: { alignItems: 'center', gap: 12 },
  genderChip: { minWidth: 140, alignItems: 'center', paddingHorizontal: 20, paddingVertical: 13, borderRadius: 12 },
  topicGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 6 },
  topicCard: { width: 104, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 6, borderRadius: 16 },
  topicIcon: { width: 58, height: 58, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  topicLabel: { fontSize: 12.5, fontWeight: '700', textAlign: 'center', lineHeight: 16 },
  topicCheck: { position: 'absolute', top: 8, right: 8 },
  othersInput: { height: 50, borderRadius: 13, borderWidth: StyleSheet.hairlineWidth, paddingHorizontal: 15, fontSize: 15, marginTop: 22 },
  idWrap: { alignItems: 'center', marginTop: 40, marginBottom: 8 },
  idCard: { width: 240, flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: 16, transform: [{ rotate: '-4deg' }], shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 4 },
  idPhoto: { width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  idLine: { height: 8, borderRadius: 4 },
  idHeart: { position: 'absolute', right: 12, bottom: 12 },
  cityWrap: { alignItems: 'center', marginTop: 18, marginBottom: 22 },
  skyline: { flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingBottom: 4, borderBottomWidth: 2, borderBottomColor: 'rgba(128,128,128,0.25)', paddingHorizontal: 6 },
  cityGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 10 },
  cityChip: { width: '44%', alignItems: 'center', paddingVertical: 13, borderRadius: 12 },
  navRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 30 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 22, height: 48, borderRadius: 13 },
  navText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  // digest
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 14 },
  kicker: { fontSize: 11.5, fontWeight: '800', letterSpacing: 1.2 },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 4 },
  sub: { fontSize: 14.5, marginTop: 3 },
  reminder: { flexDirection: 'row', alignItems: 'center', gap: 12, marginHorizontal: 18, padding: 14, borderRadius: 16, borderWidth: StyleSheet.hairlineWidth, marginBottom: 16 },
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
