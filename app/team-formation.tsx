import { useAuth } from '@/constants/AuthContext';
import { useAppTheme } from '@/constants/ContextTheme';
import { generateName } from '@/services/nameGenerator';
import { createTeam, joinTeamByCode } from '@/services/teamService';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import {
  Button,
  Card,
  Chip,
  HelperText,
  IconButton,
  SegmentedButtons,
  Text,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function TeamFormationScreen() {
  const { theme } = useAppTheme();
  const { user, teamName: currentTeam, setTeam } = useAuth();

  const [tab, setTab] = useState<'create' | 'join'>('create');

  // Create tab
  const [myName, setMyName] = useState(() => generateName());
  const [teamName, setTeamName] = useState('');
  const [memberEmails, setMemberEmails] = useState<string[]>(['']);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [createdTeamName, setCreatedTeamName] = useState('');

  // Join tab
  const [joinCode, setJoinCode] = useState('');
  const [joinName, setJoinName] = useState(() => generateName());
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState('');

  const addEmailField = () => setMemberEmails(prev => [...prev, '']);

  const updateEmail = (index: number, value: string) =>
    setMemberEmails(prev => prev.map((e, i) => (i === index ? value : e)));

  const removeEmail = (index: number) =>
    setMemberEmails(prev => prev.filter((_, i) => i !== index));

  const handleCreate = async () => {
    if (!myName.trim() || !teamName.trim()) {
      setCreateError('Enter your name and a team name.');
      return;
    }
    setCreateError('');
    setCreating(true);
    try {
      const { teamId, joinCode: code } = await createTeam({
        teamName,
        memberEmails: memberEmails.filter(e => e.trim()),
        creatorUid: user!.uid,
        creatorEmail: user!.email!,
        creatorName: myName,
      });
      setTeam(teamId, teamName.trim(), myName.trim());
      setCreatedTeamName(teamName.trim());
      setCreatedCode(code);
    } catch (e: any) {
      setCreateError(e?.message ?? 'Failed to create team. Try again.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async () => {
    if (!joinCode.trim() || !joinName.trim()) {
      setJoinError('Enter the join code and your name.');
      return;
    }
    setJoining(true);
    setJoinError('');
    try {
      const { teamId, teamName: name } = await joinTeamByCode({
        joinCode,
        uid: user!.uid,
        email: user!.email!,
        memberName: joinName,
      });
      setTeam(teamId, name, joinName.trim());
      router.replace('/(tabs)');
    } catch (e: any) {
      setJoinError(e.message ?? 'Failed to join. Check your code.');
    } finally {
      setJoining(false);
    }
  };

  const handleShare = () => {
    Share.share({
      message: `Join my LabRats team "${createdTeamName}" — use code: ${createdCode}`,
    });
  };

  // ── Success state: show the join code ────────────────────────────────────────
  if (createdCode) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
        <ScrollView contentContainerStyle={styles.container}>
          <Text variant="headlineMedium" style={styles.title}>
            Team Created!
          </Text>
          <Text
            variant="bodyMedium"
            style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
          >
            Share this code with your teammates so they can join on their devices.
          </Text>

          <Card
            mode="contained"
            style={[styles.codeCard, { backgroundColor: theme.colors.primaryContainer }]}
          >
            <Card.Content style={styles.codeContent}>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onPrimaryContainer, letterSpacing: 1 }}
              >
                JOIN CODE
              </Text>
              <Text
                variant="displaySmall"
                style={[styles.codeText, { color: theme.colors.primary }]}
              >
                {createdCode}
              </Text>
              <Text
                variant="bodySmall"
                style={{ color: theme.colors.onPrimaryContainer }}
              >
                Team: {createdTeamName}
              </Text>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            icon="share-variant"
            onPress={handleShare}
            style={styles.shareBtn}
            contentStyle={styles.buttonContent}
          >
            Share Code
          </Button>

          <Button
            mode="outlined"
            onPress={() => router.replace('/(tabs)')}
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

  // ── Main form ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text variant="headlineMedium" style={styles.title}>
          Team Formation
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
        >
          Create a new team or join an existing one with a code.
        </Text>

        {currentTeam && (
          <Chip icon="account-group" style={styles.currentTeamChip}>
            Currently in: {currentTeam}
          </Chip>
        )}

        <SegmentedButtons
          value={tab}
          onValueChange={v => setTab(v as 'create' | 'join')}
          buttons={[
            { value: 'create', label: 'Create Team', icon: 'plus-circle-outline' },
            { value: 'join', label: 'Join with Code', icon: 'key-outline' },
          ]}
          style={styles.tabs}
        />

        {tab === 'create' ? (
          <View>
            <View style={styles.nameRow}>
              <TextInput
                mode="outlined"
                label="Your Name"
                value={myName}
                onChangeText={setMyName}
                style={styles.nameInput}
                left={<TextInput.Icon icon="account" />}
              />
              <IconButton
                icon="dice-multiple"
                size={24}
                onPress={() => setMyName(generateName())}
                mode="contained-tonal"
              />
            </View>
            <TextInput
              mode="outlined"
              label="Team Name"
              value={teamName}
              onChangeText={setTeamName}
              placeholder="e.g. Team Alpha"
              style={styles.input}
              left={<TextInput.Icon icon="account-group" />}
            />

            <Text
              variant="labelLarge"
              style={[styles.sectionLabel, { color: theme.colors.onBackground }]}
            >
              Add Teammates (optional)
            </Text>
            <Text
              variant="bodySmall"
              style={[styles.sectionHint, { color: theme.colors.onSurfaceVariant }]}
            >
              Enter their email addresses. When they sign in they'll be automatically
              placed in this team.
            </Text>

            {memberEmails.map((email, i) => (
              <View key={i} style={styles.emailRow}>
                <TextInput
                  mode="outlined"
                  label={`Teammate ${i + 1} email`}
                  value={email}
                  onChangeText={v => updateEmail(i, v)}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  style={styles.emailInput}
                />
                {memberEmails.length > 1 && (
                  <IconButton
                    icon="close-circle-outline"
                    size={22}
                    onPress={() => removeEmail(i)}
                  />
                )}
              </View>
            ))}

            <Button
              mode="outlined"
              icon="plus"
              onPress={addEmailField}
              style={styles.addBtn}
            >
              Add Another Teammate
            </Button>

            {createError ? (
              <HelperText type="error" visible>
                {createError}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={handleCreate}
              loading={creating}
              disabled={creating}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="check"
            >
              Create Team
            </Button>
          </View>
        ) : (
          <View>
            <TextInput
              mode="outlined"
              label="Join Code"
              value={joinCode}
              onChangeText={v => setJoinCode(v.toUpperCase())}
              autoCapitalize="characters"
              maxLength={6}
              placeholder="e.g. AB3X9K"
              style={styles.input}
              left={<TextInput.Icon icon="key" />}
            />
            <View style={styles.nameRow}>
              <TextInput
                mode="outlined"
                label="Your Name"
                value={joinName}
                onChangeText={setJoinName}
                style={styles.nameInput}
                left={<TextInput.Icon icon="account" />}
              />
              <IconButton
                icon="dice-multiple"
                size={24}
                onPress={() => setJoinName(generateName())}
                mode="contained-tonal"
              />
            </View>

            {joinError ? (
              <HelperText type="error" visible>
                {joinError}
              </HelperText>
            ) : null}

            <Button
              mode="contained"
              onPress={handleJoin}
              loading={joining}
              disabled={joining}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="account-plus"
            >
              Join Team
            </Button>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flexGrow: 1, padding: 24 },
  title: { textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', marginBottom: 16 },
  currentTeamChip: { alignSelf: 'center', marginBottom: 16 },
  tabs: { marginBottom: 24 },
  sectionLabel: { marginBottom: 4, marginTop: 4 },
  sectionHint: { marginBottom: 12, lineHeight: 18 },
  input: { marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  nameInput: { flex: 1 },
  emailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  emailInput: { flex: 1 },
  addBtn: { marginBottom: 16 },
  button: { marginTop: 8, marginBottom: 8 },
  buttonContent: { paddingVertical: 8 },
  shareBtn: { marginBottom: 12 },
  codeCard: { marginBottom: 20 },
  codeContent: { alignItems: 'center', paddingVertical: 16, gap: 8 },
  codeText: { fontWeight: 'bold', letterSpacing: 10 },
});
