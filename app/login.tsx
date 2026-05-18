import { useAppTheme } from '@/constants/ContextTheme';
import { auth } from '@/firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const { theme } = useAppTheme();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (mode === 'signup' && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
      }
      // AuthGuard in _layout.tsx handles navigation after auth state updates
    } catch (e: any) {
      console.error('[Auth error]', e?.code, e?.message);
      setError(friendlyError(e?.code ?? ''));
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(m => (m === 'signin' ? 'signup' : 'signin'));
    setError('');
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
      >
        <ScrollView
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text
              variant="displaySmall"
              style={[styles.appName, { color: theme.colors.primary }]}
            >
              LabRats
            </Text>
            <Text
              variant="bodyLarge"
              style={[styles.tagline, { color: theme.colors.onSurfaceVariant }]}
            >
              STEMM Activity Explorer
            </Text>
          </View>

          <View style={styles.form}>
            <Text
              variant="headlineSmall"
              style={[styles.formTitle, { color: theme.colors.onBackground }]}
            >
              {mode === 'signin' ? 'Welcome back' : 'Create account'}
            </Text>

            {error ? (
              <HelperText type="error" visible style={styles.errorText}>
                {error}
              </HelperText>
            ) : null}

            <TextInput
              mode="outlined"
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
              style={styles.input}
              left={<TextInput.Icon icon="email-outline" />}
            />

            <TextInput
              mode="outlined"
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              style={styles.input}
              left={<TextInput.Icon icon="lock-outline" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? 'eye-off' : 'eye'}
                  onPress={() => setShowPassword(v => !v)}
                />
              }
            />

            {mode === 'signup' && (
              <TextInput
                mode="outlined"
                label="Confirm Password"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                autoComplete="new-password"
                style={styles.input}
                left={<TextInput.Icon icon="lock-check-outline" />}
              />
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              contentStyle={styles.submitContent}
            >
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Button>

            <Button mode="text" onPress={toggleMode}>
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function friendlyError(code: string): string {
  switch (code) {
    case 'auth/invalid-email':
      return 'Invalid email address.';
    case 'auth/user-not-found':
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/INVALID_LOGIN_CREDENTIALS':
      return 'Incorrect email or password.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled. Check Firebase Console.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters.';
    default:
      return `Error (${code ?? 'unknown'}). Check your connection and try again.`;
  }
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: 48 },
  appName: { fontWeight: 'bold', letterSpacing: 1 },
  tagline: { marginTop: 6 },
  form: {},
  formTitle: { marginBottom: 12, textAlign: 'center' },
  errorText: { fontSize: 14, marginBottom: 4 },
  input: { marginBottom: 12 },
  submitButton: { marginTop: 4, marginBottom: 4 },
  submitContent: { paddingVertical: 6 },
});
