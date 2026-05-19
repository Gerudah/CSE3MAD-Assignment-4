import LightDarkToggle from '@/components/light-dark';
import { useAuth } from '@/constants/AuthContext';
import { useAppTheme } from '@/constants/ContextTheme';
import { generateName } from '@/services/nameGenerator';
import { leaveTeam, updateMemberName } from '@/services/teamService';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { Avatar, Button, Card, Divider, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AccountScreen() {
  const { user, teamId, teamName, memberName, logout, clearTeam, updateName } = useAuth();
  const { theme } = useAppTheme();

  const [newName, setNewName] = useState(memberName ?? '');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [leaving, setLeaving] = useState(false);

  const initials = (memberName ?? user?.email ?? '?')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('') || '?';

  async function handleSaveName() {
    if (!newName.trim()) return;
    setSaving(true);
    setSaveError('');
    try {
      await updateMemberName(user!.uid, newName);
      updateName(newName.trim());
    } catch {
      setSaveError('Could not save name. Try again.');
    } finally {
      setSaving(false);
    }
  }

  function handleLeaveTeam() {
    Alert.alert(
      'Leave Team',
      `Are you sure you want to leave "${teamName}"? You can rejoin later with the team code.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            setLeaving(true);
            try {
              await leaveTeam(user!.uid);
              clearTeam();
            } catch {
              Alert.alert('Error', 'Could not leave team. Try again.');
            } finally {
              setLeaving(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Account</Text>

        <View style={styles.avatarRow}>
          <Avatar.Text size={72} label={initials} />
          <View style={styles.identity}>
            <Text variant="titleLarge">{memberName ?? 'No name set'}</Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {user?.email ?? ''}
            </Text>
          </View>
        </View>

        <Card style={styles.card} mode="outlined">
          <Card.Content>
            <Text variant="labelLarge" style={[styles.cardLabel, { color: theme.colors.onSurfaceVariant }]}>
              TEAM
            </Text>
            {teamId ? (
              <Text variant="titleMedium">{teamName}</Text>
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Not in a team — go to Activities to join one.
              </Text>
            )}
          </Card.Content>
        </Card>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>Display Name</Text>
        <View style={styles.nameRow}>
          <TextInput
            mode="outlined"
            label="Your name"
            value={newName}
            onChangeText={setNewName}
            style={styles.nameInput}
          />
          <Button
            mode="outlined"
            icon="dice-multiple"
            onPress={() => setNewName(generateName())}
            style={styles.shuffleBtn}
            contentStyle={styles.shuffleContent}
          >
            Shuffle
          </Button>
        </View>
        {saveError ? <HelperText type="error" visible>{saveError}</HelperText> : null}
        <Button
          mode="contained"
          onPress={handleSaveName}
          loading={saving}
          disabled={saving || !newName.trim() || newName.trim() === memberName}
          icon="content-save"
          style={styles.button}
        >
          Save Name
        </Button>

        <Divider style={styles.divider} />

        <Text variant="titleMedium" style={styles.sectionTitle}>Preferences</Text>
        <View style={[styles.prefRow, { backgroundColor: theme.colors.surfaceVariant }]}>
          <Text variant="bodyLarge">Dark Mode</Text>
          <LightDarkToggle />
        </View>

        <Divider style={styles.divider} />

        {teamId && (
          <Button
            mode="outlined"
            icon="account-remove"
            onPress={handleLeaveTeam}
            loading={leaving}
            disabled={leaving}
            textColor={theme.colors.error}
            style={[styles.button, { borderColor: theme.colors.error }]}
          >
            Leave Team
          </Button>
        )}

        <Button
          mode="contained-tonal"
          icon="logout"
          onPress={logout}
          style={styles.button}
        >
          Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { padding: 24 },
  title: { textAlign: 'center', marginBottom: 24 },
  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 20 },
  identity: { flex: 1, gap: 4 },
  card: { marginBottom: 4 },
  cardLabel: { marginBottom: 4 },
  divider: { marginVertical: 20 },
  sectionTitle: { marginBottom: 12 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  nameInput: { flex: 1 },
  shuffleBtn: { alignSelf: 'center' },
  shuffleContent: { paddingVertical: 4 },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  button: { marginBottom: 10 },
});
