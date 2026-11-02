import { useMutation } from '@tanstack/react-query';
import { router, Stack } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import { Button, Card, FONT, Segmented, Txt } from '../components/ui';
import { api, ApiError } from '../lib/api';
import { useSession } from '../lib/session';
import { showToast } from '../lib/toast';
import { radius, space, TOUCH, useTheme } from '../lib/theme';

/** UI-21: demo sign-up and login with email and password, stored on this phone (or the PC server in server mode). */
export default function LoginScreen() {
  const t = useTheme();
  const { t: tr } = useTranslation();
  const { signIn } = useSession();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string>();

  const submit = useMutation({
    mutationFn: () => (mode === 'login' ? api.logIn(email, password) : api.signUp(email, password, name)),
    onSuccess: async (account) => {
      await signIn(account);
      showToast(tr('auth.welcomeBack', { name: account.display_name }));
      router.back();
    },
    onError: (e) => setError(tr(`errors.${e instanceof ApiError && e.code ? e.code : 'generic'}`, { defaultValue: tr('common.error') })),
  });

  const input = [styles.input, { color: t.text, borderColor: t.border, backgroundColor: t.surface, fontFamily: FONT.regular }];
  return (
    <ScrollView style={{ backgroundColor: t.background }} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: tr('auth.loginWithEmail') }} />
      <Segmented
        options={[{ value: 'login', label: tr('auth.logIn') }, { value: 'signup', label: tr('auth.signUp') }]}
        value={mode}
        onChange={(m) => { setMode(m); setError(undefined); }}
      />
      {mode === 'signup' && (
        <TextInput value={name} onChangeText={setName} placeholder={tr('auth.name')} placeholderTextColor={t.textMuted}
          accessibilityLabel={tr('auth.name')} autoComplete="name" style={input} />
      )}
      <TextInput value={email} onChangeText={setEmail} placeholder={tr('auth.email')} placeholderTextColor={t.textMuted}
        accessibilityLabel={tr('auth.email')} keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} style={input} />
      <TextInput value={password} onChangeText={setPassword} placeholder={tr('auth.password')} placeholderTextColor={t.textMuted}
        accessibilityLabel={tr('auth.password')} secureTextEntry autoComplete={mode === 'login' ? 'password' : 'new-password'} style={input} />
      {error && <Txt color={t.danger} accessibilityLiveRegion="polite">{error}</Txt>}
      <Button
        primary
        label={mode === 'login' ? tr('auth.logIn') : tr('auth.createAccount')}
        disabled={!email || !password || (mode === 'signup' && !name) || submit.isPending}
        onPress={() => submit.mutate()}
      />
      <Card>
        <Txt variant="caption" muted>{tr('auth.demoNote')}</Txt>
        <Txt variant="caption" muted>{tr('auth.passwordHint')}</Txt>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  page: { padding: space.l, gap: space.m },
  input: { minHeight: TOUCH + 6, borderWidth: 1, borderRadius: radius.s, paddingHorizontal: 14, fontSize: 16 },
});
