import { useAuth } from '@/constants/AuthContext';
import { useAppTheme } from '@/constants/ContextTheme';
import { db as firestoreDb } from '@/firebaseConfig';
import { router } from 'expo-router';
import { doc, setDoc } from 'firebase/firestore';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeamFormationScreen() {
  const { theme } = useAppTheme();
  const { user, teamName: savedTeamName, memberName: savedMemberName, setTeam } = useAuth();

  const [teamName, setTeamName] = useState(savedTeamName ?? '');
  const [memberName, setMemberName] = useState(savedMemberName ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleContinue = async () => {
    if (!teamName.trim() || !memberName.trim()) {
      setError('Please enter both a team name and your name.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const teamId = teamName.trim().toLowerCase().replace(/\s+/g, '-');
      if (user) {
        await setDoc(doc(firestoreDb, 'user_profiles', user.uid), {
          team_id: teamId,
          team_name: teamName.trim(),
          member_name: memberName.trim(),
          updated_at: Date.now(),
        });
      }
      setTeam(teamId, teamName.trim(), memberName.trim());
      router.replace('/(tabs)');
    } catch {
      setError('Failed to save team. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>
          Team Formation
        </Text>
        <Text
          variant="bodyLarge"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Set up your team to start participating in STEMM activities.
        </Text>

        {error ? <HelperText type="error" visible>{error}</HelperText> : null}

        <TextInput
          mode="outlined"
          label="Team Name"
          value={teamName}
          onChangeText={setTeamName}
          placeholder="e.g. Team Alpha"
          style={styles.input}
          left={<TextInput.Icon icon="account-group" />}
        />

        <TextInput
          mode="outlined"
          label="Your Name"
          value={memberName}
          onChangeText={setMemberName}
          placeholder="e.g. Alex"
          style={styles.input}
          left={<TextInput.Icon icon="account" />}
        />

        <Button
          mode="contained"
          onPress={handleContinue}
          loading={loading}
          disabled={loading}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="arrow-right"
        >
          Continue to App
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: 24, justifyContent: 'center' },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 32 },
  input: { marginBottom: 16 },
  button: { marginTop: 8 },
  buttonContent: { paddingVertical: 8 },
});
