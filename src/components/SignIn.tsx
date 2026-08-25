// ─── SignIn — Google · Facebook · Apple · Phone (OTP) ─────────────────────────
// Google + Phone are REAL (Firebase) on the device dev build. On web preview they
// fall back to a demo tap-through. Facebook/Apple stay demo until wired next.
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { useApp, type User } from '@/store/app';
import { authReady, confirmOtp, sendOtp, signInWithFacebook, signInWithGoogle } from '@/services/auth';

type Props = { visible: boolean; onClose: () => void; onSuccess?: () => void };
type Step = 'options' | 'phone' | 'otp';

const ICON = require('../../assets/images/icon.png');

export default function SignIn({ visible, onClose, onSuccess }: Props) {
  const { palette, signIn } = useApp();
  const t = useT();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<Step>('options');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmation, setConfirmation] = useState<any>(null);

  const reset = () => {
    setStep('options');
    setPhone('');
    setOtp('');
    setBusy(false);
    setError('');
    setConfirmation(null);
  };
  const done = (u: User) => {
    signIn(u);
    reset();
    onSuccess?.();
    onClose();
  };
  const cancel = () => {
    reset();
    onClose();
  };

  const NEEDS_APP = 'Please open the Mini Shorts app on your phone to sign in.';

  // Google — real Firebase sign-in only (no demo).
  const onGoogle = async () => {
    setError('');
    setBusy(true);
    try {
      const u = await signInWithGoogle();
      done(u);
    } catch (e: any) {
      if (e?.message === 'web-preview') {
        setError(NEEDS_APP);
      } else if (String(e?.code).includes('cancel') || String(e?.message).toLowerCase().includes('cancel')) {
        // user closed the Google sheet — do nothing
      } else {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  // Phone — send a REAL OTP via SMS (no demo).
  const onSendCode = async () => {
    setError('');
    if (!authReady()) {
      setError(NEEDS_APP);
      return;
    }
    setBusy(true);
    try {
      const conf = await sendOtp(`+91${phone}`);
      setConfirmation(conf);
      setStep('otp');
    } catch (e: any) {
      const detail = e?.code || e?.message || 'unknown';
      setError(`Could not send the code (${detail}).`);
    } finally {
      setBusy(false);
    }
  };

  const onVerify = async () => {
    setError('');
    if (!confirmation) {
      setError(NEEDS_APP);
      return;
    }
    setBusy(true);
    try {
      const u = await confirmOtp(confirmation, otp);
      done(u);
    } catch (e: any) {
      setError('Wrong or expired code. Try again.');
    } finally {
      setBusy(false);
    }
  };

  // Facebook — real Firebase sign-in (wired once your Facebook App ID is set).
  const onFacebook = async () => {
    setError('');
    setBusy(true);
    try {
      const u = await signInWithFacebook();
      done(u);
    } catch (e: any) {
      if (String(e?.message).toLowerCase().includes('cancel')) {
        // user cancelled
      } else if (e?.message === 'not-configured') {
        setError('Facebook sign-in isn’t set up yet.');
      } else {
        setError('Facebook sign-in failed. Please try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  const phoneValid = /^[0-9]{10}$/.test(phone);
  const otpValid = /^[0-9]{4,6}$/.test(otp);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={cancel}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={[styles.root, { backgroundColor: palette.card, paddingTop: insets.top + 6 }]}>
        {/* Cancel / Back */}
        <View style={styles.topBar}>
          <Pressable onPress={step === 'options' ? cancel : () => setStep(step === 'otp' ? 'phone' : 'options')} hitSlop={10}>
            <Text style={[styles.cancel, { color: '#2F80ED' }]}>{step === 'options' ? t('cancel') : 'Back'}</Text>
          </Pressable>
        </View>

        {/* App icon */}
        <Image source={ICON} style={styles.appIcon} contentFit="cover" />

        <View style={styles.body}>
          {step === 'options' && (
            <>
              <Pressable onPress={onGoogle} disabled={busy} style={[styles.btn, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth, opacity: busy ? 0.6 : 1 }]}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={[styles.btnText, { color: palette.text }]}>Sign in with google</Text>
              </Pressable>

              <Pressable onPress={onFacebook} disabled={busy} style={[styles.btn, { backgroundColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={20} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff' }]}>Sign in with facebook</Text>
              </Pressable>

              <Pressable onPress={() => setError('Apple sign-in works on iPhone (needs an Apple Developer account).')} disabled={busy} style={[styles.btn, { backgroundColor: '#000' }]}>
                <Ionicons name="logo-apple" size={21} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff' }]}>Sign in with apple</Text>
              </Pressable>

              <Pressable onPress={() => setStep('phone')} disabled={busy} style={[styles.btn, { backgroundColor: '#2D9CDB' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff' }]}>Sign in with phone</Text>
              </Pressable>

              {busy && <ActivityIndicator style={{ marginTop: 4 }} color={palette.accent} />}
              {!!error && <Text style={[styles.errText, { color: '#E11D48' }]}>{error}</Text>}
            </>
          )}

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
              <Pressable onPress={onSendCode} disabled={!phoneValid || busy} style={[styles.cta, { backgroundColor: phoneValid && !busy ? palette.accent : palette.surfaceAlt }]}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={[styles.ctaText, { color: phoneValid ? '#fff' : palette.textFaint }]}>{t('sendCode')}</Text>}
              </Pressable>
              {!!error && <Text style={[styles.errText, { color: '#E11D48' }]}>{error}</Text>}
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={[styles.title, { color: palette.text }]}>{t('enterCode')}</Text>
              <Text style={[styles.desc, { color: palette.textMuted }]}>{t('codeSentTo')} +91 {phone}</Text>
              {!confirmation && (
                <View style={[styles.demoBanner, { backgroundColor: palette.accentSoft }]}>
                  <Ionicons name="information-circle-outline" size={16} color={palette.accent} />
                  <Text style={[styles.demoText, { color: palette.accent }]}>{t('demoOtp')}</Text>
                </View>
              )}
              <TextInput
                value={otp}
                onChangeText={(v) => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                placeholder="••••••"
                placeholderTextColor={palette.textFaint}
                keyboardType="number-pad"
                style={[styles.otpInput, { color: palette.text, backgroundColor: palette.surfaceAlt, borderColor: palette.border }]}
                autoFocus
              />
              <Pressable onPress={onVerify} disabled={!otpValid || busy} style={[styles.cta, { backgroundColor: otpValid && !busy ? palette.accent : palette.surfaceAlt }]}>
                {busy ? <ActivityIndicator color="#fff" /> : <Text style={[styles.ctaText, { color: otpValid ? '#fff' : palette.textFaint }]}>{t('verify')}</Text>}
              </Pressable>
              {!!error && <Text style={[styles.errText, { color: '#E11D48' }]}>{error}</Text>}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: 24 },
  topBar: { height: 40, justifyContent: 'center' },
  cancel: { fontSize: 17, fontWeight: '600' },
  appIcon: { width: 84, height: 84, borderRadius: 20, alignSelf: 'center', marginTop: 40 },
  body: { marginTop: 60, gap: 16 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: 12 },
  btnText: { fontSize: 16, fontWeight: '700' },
  title: { fontSize: 21, fontWeight: '900', letterSpacing: -0.4, marginBottom: 6 },
  desc: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  phoneRow: { flexDirection: 'row', alignItems: 'center', height: 54, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, overflow: 'hidden' },
  cc: { fontSize: 16, fontWeight: '800', paddingHorizontal: 15, borderRightWidth: StyleSheet.hairlineWidth, lineHeight: 54 },
  phoneInput: { flex: 1, fontSize: 17, fontWeight: '700', paddingHorizontal: 14, letterSpacing: 1 },
  demoBanner: { flexDirection: 'row', alignItems: 'center', gap: 7, paddingHorizontal: 12, paddingVertical: 9, borderRadius: 10, marginBottom: 14 },
  demoText: { fontSize: 12.5, fontWeight: '700', flex: 1 },
  otpInput: { height: 56, borderRadius: 14, borderWidth: StyleSheet.hairlineWidth, fontSize: 26, fontWeight: '800', textAlign: 'center', letterSpacing: 12 },
  cta: { alignItems: 'center', justifyContent: 'center', height: 54, borderRadius: 14, marginTop: 20 },
  ctaText: { fontSize: 16, fontWeight: '800' },
  errText: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 6 },
});
