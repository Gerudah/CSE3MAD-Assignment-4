import { useAuth } from '@/constants/AuthContext';
import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import { router } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReactionBoardSetupScreen() {
  const { theme } = useAppTheme();
  const { teamId, teamName, memberName } = useAuth();

  async function handleContinue() {
    const sessionId = await sessionService.create(teamId ?? 'unknown', 'reaction_board');
    router.push({
      pathname: '/activity/reaction-board-test',
      params: {
        sessionId,
        teamName: teamName ?? '',
        memberName: memberName ?? '',
      },
    });
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineSmall" style={styles.title}>
          Before You Start
        </Text>

        <Text variant="bodyLarge" style={styles.subtitle}>
          You will complete three phases to measure and compare reaction speed.
        </Text>

        <Text
          variant="bodyMedium"
          style={[styles.note, { backgroundColor: theme.colors.surfaceVariant }]}
        >
          You will complete three phases:{'\n'}
          {'  '}1. Dominant hand reaction test{'\n'}
          {'  '}2. Non-dominant hand reaction test{'\n'}
          {'  '}3. Tracing accuracy challenge
        </Text>

        <Button
          mode="contained"
          onPress={handleContinue}
          style={styles.button}
          contentStyle={styles.buttonContent}
          icon="arrow-right"
        >
          Start Tests
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24 },
  title: { marginBottom: 8, textAlign: 'center' },
  subtitle: { marginBottom: 24, textAlign: 'center' },
  note: { padding: 14, marginBottom: 24, lineHeight: 22, borderRadius: 8 },
  button: {},
  buttonContent: { paddingVertical: 8 },
});
