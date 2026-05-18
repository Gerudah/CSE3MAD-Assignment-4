import { useAppTheme } from '@/constants/ContextTheme';
import { sessionService } from '@/db';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReactionBoardSetupScreen() {
  const { theme } = useAppTheme();

  const [teamName, setTeamName] = useState('');
  const [memberName, setMemberName] = useState('');

  const valid = teamName.trim().length > 0 && memberName.trim().length > 0;

  async function handleContinue() {
    if (!valid) return;
    const sessionId = await sessionService.create(teamName.trim(), 'reaction_board');
    router.push({
      pathname: '/activity/reaction-board-test',
      params: {
        sessionId,
        teamName: teamName.trim(),
        memberName: memberName.trim(),
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
          Enter your team and member details before completing the reaction tests.
        </Text>

        <View style={styles.field}>
          <TextInput
            label="Team name"
            mode="outlined"
            value={teamName}
            onChangeText={setTeamName}
            placeholder="e.g. Lab Rats"
          />
          <HelperText type="info">
            This will be saved with your reaction results.
          </HelperText>
        </View>

        <View style={styles.field}>
          <TextInput
            label="Team member name"
            mode="outlined"
            value={memberName}
            onChangeText={setMemberName}
            placeholder="e.g. Josh"
          />
          <HelperText type="info">
            Each team member should complete the tests separately.
          </HelperText>
        </View>

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
          disabled={!valid}
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
  safe: {
    flex: 1,
  },
  container: {
    padding: 24,
  },
  title: {
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    marginBottom: 24,
    textAlign: 'center',
  },
  field: {
    marginBottom: 12,
  },
  note: {
    padding: 14,
    marginBottom: 24,
    lineHeight: 22,
    borderRadius: 8,
  },
  button: {},
  buttonContent: {
    paddingVertical: 8,
  },
});
