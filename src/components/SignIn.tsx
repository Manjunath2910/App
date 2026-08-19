// ─── SignIn — Google · Facebook · Apple · Phone (OTP) ─────────────────────────
// Google/Facebook/Apple sign in locally for now; Phone runs a local OTP flow.
// Real OAuth needs provider credentials + a backend (see FIREBASE_AUTH_SETUP.md).
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useT } from '@/i18n';
import { useApp, type User } from '@/store/app';

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

  const reset = () => {
    setStep('options');
    setPhone('');
    setOtp('');
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
              <Pressable onPress={() => done({ name: 'Google account', email: '' })} style={[styles.btn, { backgroundColor: palette.card, borderColor: palette.border, borderWidth: StyleSheet.hairlineWidth }]}>
                <Ionicons name="logo-google" size={20} color="#EA4335" />
                <Text style={[styles.btnText, { color: palette.text }]}>Sign in with google</Text>
              </Pressable>

              <Pressable onPress={() => done({ name: 'Facebook account', email: '' })} style={[styles.btn, { backgroundColor: '#1877F2' }]}>
                <Ionicons name="logo-facebook" size={20} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff' }]}>Sign in with facebook</Text>
              </Pressable>

              <Pressable onPress={() => done({ name: 'Apple account', email: '' })} style={[styles.btn, { backgroundColor: '#000' }]}>
                <Ionicons name="logo-apple" size={21} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff' }]}>Sign in with apple</Text>
              </Pressable>

              <Pressable onPress={() => setStep('phone')} style={[styles.btn, { backgroundColor: '#2D9CDB' }]}>
                <Ionicons name="phone-portrait-outline" size={20} color="#fff" />
                <Text style={[styles.btnText, { color: '#fff' }]}>Sign in with phone</Text>
              </Pressable>
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
              <Pressable onPress={() => setStep('otp')} disabled={!phoneValid} style={[styles.cta, { backgroundColor: phoneValid ? palette.accent : palette.surfaceAlt }]}>
                <Text style={[styles.ctaText, { color: phoneValid ? '#fff' : palette.textFaint }]}>{t('sendCode')}</Text>
              </Pressable>
            </>
          )}

          {step === 'otp' && (
            <>
              <Text style={[styles.title, { color: palette.text }]}>{t('enterCode')}</Text>
              <Text style={[styles.desc, { color: palette.textMuted }]}>{t('codeSentTo')} +91 {phone}</Text>
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
              <Pressable onPress={() => done({ name: `+91 ${phone}`, email: '' })} disabled={!otpValid} style={[styles.cta, { backgroundColor: otpValid ? palette.accent : palette.surfaceAlt }]}>
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
});
