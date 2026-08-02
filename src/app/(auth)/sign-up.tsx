import { Link, router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { TextField } from '@/components/text-field';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSignUp() {
    setError(null);
    if (!email.trim() || password.length < 6) {
      setError('Enter a valid email and a password with at least 6 characters.');
      return;
    }
    setLoading(true);
    const { data, error: signUpError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
    });
    setLoading(false);

    if (signUpError) {
      setError(signUpError.message);
      return;
    }
    if (!data.session) {
      // Email confirmation is required before a session is issued.
      setNeedsConfirmation(true);
      return;
    }
    router.replace('/');
  }

  if (needsConfirmation) {
    return (
      <ThemedView style={styles.container}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title" style={styles.title}>
            Check your email
          </ThemedText>
          <ThemedText themeColor="textSecondary">
            We sent a confirmation link to {email}. Confirm it, then come back and sign in.
          </ThemedText>
          <Button label="Go to sign in" onPress={() => router.replace('/(auth)/sign-in')} />
        </SafeAreaView>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}>
        <SafeAreaView style={styles.safeArea}>
          <ThemedText type="title" style={styles.title}>
            Create your account
          </ThemedText>

          <View style={styles.form}>
            <TextField
              label="Email"
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
            />
            <TextField
              label="Password"
              secureTextEntry
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              placeholder="At least 6 characters"
            />
            {error ? (
              <ThemedText themeColor="danger" type="small">
                {error}
              </ThemedText>
            ) : null}
          </View>

          <View style={styles.actions}>
            <Button label="Sign up" onPress={handleSignUp} loading={loading} />
            <Link href="/(auth)/sign-in" asChild>
              <Button label="Already have an account? Sign in" variant="ghost" />
            </Link>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.five,
    alignSelf: 'center',
    width: '100%',
    maxWidth: MaxContentWidth,
  },
  title: { fontSize: 28, lineHeight: 34 },
  form: { gap: Spacing.three },
  actions: { gap: Spacing.two, marginTop: 'auto', paddingBottom: Spacing.four },
});
