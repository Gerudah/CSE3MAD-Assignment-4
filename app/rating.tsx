import { useAppTheme } from '@/constants/ContextTheme';
import { Filter } from 'bad-words';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Button, HelperText, Text, TextInput } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';

const profanityFilter = new Filter();

export default function RatingScreen() {
  const { activity } = useLocalSearchParams<{ activity: string }>();
  const { theme } = useAppTheme();
  const activityName = activity ?? 'Unknown Activity';

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (rating === 0) {
      setError('Please choose a star rating first.');
      return;
    }
    if (profanityFilter.isProfane(comment)) {
      setError('Inappropriate language detected. Please revise your comment.');
      return;
    }
    setError('');
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'ratings'), {
        activity: activityName,
        rating,
        comment: comment.trim(),
        userId: auth.currentUser?.uid ?? 'guest',
        createdAt: serverTimestamp(),
      });
    } catch {
      // non-fatal — navigate anyway
    } finally {
      setSubmitting(false);
      router.replace('/(tabs)/activity');
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <View style={styles.container}>
        <Text variant="headlineMedium" style={styles.title}>Rate This Activity</Text>
        <Text variant="titleMedium" style={[styles.activityName, { color: theme.colors.onSurfaceVariant }]}>
          {activityName}
        </Text>

        <Text variant="bodyLarge" style={styles.label}>How would you rate it?</Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map(n => (
            <Pressable key={n} onPress={() => setRating(n)} hitSlop={8}>
              <Text style={[styles.star, { color: rating >= n ? '#FFC107' : theme.colors.outlineVariant }]}>
                {rating >= n ? '★' : '☆'}
              </Text>
            </Pressable>
          ))}
        </View>

        <TextInput
          label="Comment (optional)"
          mode="outlined"
          multiline
          numberOfLines={4}
          value={comment}
          onChangeText={setComment}
          style={styles.input}
          placeholder="What did you enjoy or find challenging?"
        />

        {error ? <HelperText type="error" visible style={styles.error}>{error}</HelperText> : null}

        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={submitting}
          loading={submitting}
          style={styles.button}
          icon="send"
        >
          Submit Rating
        </Button>

        <Button
          mode="text"
          onPress={() => router.replace('/(tabs)/activity')}
          disabled={submitting}
        >
          Skip
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  container: { flex: 1, padding: 28, alignItems: 'center', justifyContent: 'center' },
  title: { marginBottom: 6, textAlign: 'center' },
  activityName: { marginBottom: 32, textAlign: 'center' },
  label: { marginBottom: 12 },
  starRow: { flexDirection: 'row', gap: 8, marginBottom: 32 },
  star: { fontSize: 48 },
  input: { width: '100%', marginBottom: 8 },
  error: { alignSelf: 'flex-start', marginBottom: 8 },
  button: { width: '100%', marginBottom: 12 },
});
