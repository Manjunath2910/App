// ─── SignIn — Google · Facebook · Phone (OTP) sign-in sheet ───────────────────
// Phone flow is fully functional locally (number → 6-digit code). Google/Facebook
// sign in locally for now; real OAuth needs provider credentials + a backend.
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { useApp, type User } from '@/store/app';

type Props = { visible: boolean; onClose: () => void };
type Step = 'options' | 'phone' | 'otp';

export default function SignIn({ visible, onClose }: Props) {
  const { palette, signIn } = useApp();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('options');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');

  const done = (u: User) => {
    signIn(u);
    reset();
    onClose();
  };
  const reset = () => {
    setStep('options');
    setPhone('');
    setOtp('');
  };
  const close = () => {
    reset();
    onClose();
  };

  const phoneValid = /^[0-9]{10}$/.test(phone);
  const otpValid = /^[0-9]{4,6}$/.test(otp);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={close} statusBarTranslucent>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.root}>
        <Pressable style={styles.backdrop} onPress={close} />
        <View style={[styles.sheet, { backgroundColor: palette.card, paddingBottom: insets.bottom + 18 }]}>
          <View style={styles.grip} />

          {step !== 'options' && (
            <Pressable onPress={() => setStep(step === 'otp' ? 'phone' : 'options')} style={styles.back} hitSlop={10}>
              <Ionicons name="chevron-back" size={22} color={palette.text} />
            </Pressable>
          )}

          <View style={[styles.logo, { backgroundColor: palette.accent }]}>
            <Text style={styles.logoText}>M</Text>
          </View>

          {/* ── Options ── */}
          {step === 'options' && (
            <>
              <Text style={[styles.title, { color: palette.text }]}>{t('signInTitle')}</Text>
              <Text style={[styles.desc, { color: palette.textMuted }]}>{t('signInDesc')}</Text>

              <Pressable
                onPress={() => done({ name: 'Google account', email: '' })}
                style={[styles.provider, { backgroundColor: palette.card, borderColor: palette.border }]}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={[styles.providerText, { color: palette.text }]}>{t('withGoogle')}</Text>
              </Pressable>

              <Pressable onPress={() => done({ name: 'Facebook account', email: '' })} style={[styles.provider, { backgroundColor: '#1877F2', borderColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={20} color="#fff" />
                <Text style={[styles.providerText, { color: '#fff' }]}>{t('withFacebook')}</Text>
              </Pressable>

              <View style={styles.orRow}>
                <View style={[styles.orLine, { backgroundColor: palette.border }]} />
                <Text style={[styles.orText, { color: palette.textFaint }]}>{t('orText')}</Text>
                <View style={[styles.orLine, { backgroundColor: palette.border }]} />
              </View>

              <Pressable onPress={() => setStep('phone')} style={[styles.provider, { backgroundColor: palette.accent, borderColor: palette.accent }]}>
                <Ionicons name="call-outline" size={19} color="#fff" />
                <Text style={[styles.providerText, { color: '#fff' }]}>{t('withPhone')}</Text>
              </Pressable>

              <Text style={[styles.terms, { color: palette.textFaint }]}>{t('termsNote')}</Text>
            </>
          )}

          {/* ── Phone number ── */}
          {step === 'phone' && (
            <>
              <Text style={[styles.title, { color: palette.text }]}>{t('enterPhone')}</Text>
              <Text style={[styles.desc, { color: palette.textMuted }]}>{t('phoneDesc')}</Text>
              <View style={[styles.phoneRow, { backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}>
                <Text style={[styles.cc, { color: palette.text, borderRightColor: palette.border }]}>+91</Text>
                <TextInput
                  value={phone}
                  onChangeText={(v) => setPhone(v.replace(/\D/g, '').slice(0, 10))}
                  placeholder="98765 43210"
                  placeholderTextColor={palette.textFaint}
                  keyboardType="number-pad"
                  style={[styles.phoneInput, { color: palette.text }]}
                  autoFocus
                />
              </View>
              <Pressable
                onPress={() => setStep('otp')}
                disabled={!phoneValid}
                style={[styles.cta, { backgroundColor: phoneValid ? palette.accent : palette.surfaceAlt }]}>
                <Text style={[styles.ctaText, { color: phoneValid ? '#fff' : palette.textFaint }]}>{t('sendCode')}</Text>
              </Pressable>
            </>
          )}

          {/* ── OTP ── */}
          {step === 'otp' && (
            <>
              <Text style={[styles.title, { color: palette.text }]}>{t('enterCode')}</Text>
              <Text style={[styles.desc, { color: palette.textMuted }]}>
                {t('codeSentTo')} +91 {phone}
              </Text>
              <View style={[styles.demoBanner, { backgroundColor: palette.accentSoft }]}>
                <Ionicons name="information-circle-outline" size={16} color={palette.accent} />
                <Text style={[styles.demoText, { color: palette.accent }]}>{t('demoOtp')}</Text>
              </View>
              <TextInput
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                placeholderTextColor={palette.textFaint}
                keyboardType="number-pad"
                style={[styles.otpInput, { color: palette.text, backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                autoFocus
              />
              <Pressable
                onPress={() => done({ name: `+91 ${phone}`, email: '' })}
                disabled={!otpValid}
                style={[styles.cta, { backgroundColor: otpValid ? palette.accent : palette.surfaceAlt }]}>
                <Text style={[styles.ctaText, { color: otpValid ? '#fff' : palette.textFaint }]}>{t('verify')}</Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 22, paddingTop: 10 },
  grip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: 'rgba(128,128,128,0.4)', marginBottom: 16 },
  back: { position: 'absolute', left: 16, top: 18, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  logo: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  logoText: { color: '#fff', fontSize: 24, fontWeight: '900' },
  title: { fontSize: 21, fontWeight: '900', letterSpacing: -0.4 },
  desc: { fontSize: 14, lineHeight: 20, marginTop: 6, marginBottom: 18 },
  provider: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    height: 52,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 11,
  },
  providerText: { fontSize: 15.5, fontWeight: '800' },
  orRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 },
  orLine: { flex: 1, height: StyleSheet.hairlineWidth },
  orText: { fontSize: 12.5, fontWeight: '700' },
  terms: { fontSize: 11.5, textAlign: 'center', marginTop: 16, lineHeight: 17 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', height: 52, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cc: { fontSize: 16, fontWeight: '800', paddingHorizontal: 15, borderRightWidth: StyleSheet.hairlineWidth, height: '100%', textAlignVertical: 'center', lineHeight: 52 },
  phoneInput: { flex: 1, fontSize: 17, fontWeight: '700', paddingHorizontal: 14, letterSpacing: 1 },
  demoBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, marginBottom: 14 },
  demoText: { fontSize: 12.5, fontWeight: '700', flex: 1 },
  otpInput: { height: 56, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: 12 },
  cta: { alignItems: 'center', justifyContent: 'center', height: 52, borderRadius: 14, marginTop: 20 },
  ctaText: { fontSize: 16, fontWeight: '800' },
});
