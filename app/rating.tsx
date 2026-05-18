import { useAppTheme } from '@/constants/ContextTheme';
import { Filter } from 'bad-words';
import { router, useLocalSearchParams } from 'expo-router';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { auth, db } from '../firebaseConfig';

const filter = new Filter();

export default function RatingScreen() {
  const { activity } = useLocalSearchParams();
  const { theme } = useAppTheme();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submittedMessage, setSubmittedMessage] = useState('');

  const [savedRatings, setSavedRatings] = useState<
    { activity: string; rating: number; comment: string }[]
  >([]);

  const handleSubmit = async () => {
    if (rating === 0) {
      setSubmittedMessage('Please choose a rating first.');
      return;
    }

    if (filter.isProfane(comment)) {
      setSubmittedMessage('Inappropriate language detected. Please fix your comment.');
      return;
    }

    const activityName = activity ? String(activity) : 'Unknown Activity';

    try {
      await addDoc(collection(db, 'ratings'), {
        activity: activityName,
        rating,
        comment,
        userId: auth.currentUser?.uid || 'guest',
        userEmail: auth.currentUser?.email || 'guest',
        createdAt: serverTimestamp(),
      });

      setSavedRatings([
        ...savedRatings,
        { activity: activityName, rating, comment },
      ]);

      setSubmittedMessage(`Rating submitted for ${activityName}: ${rating}/5`);
      setRating(0);
      setComment('');
    } catch (error: any) {
      setSubmittedMessage(`Rating recorded locally, but Firebase save failed: ${error.message}`);

      setSavedRatings([
        ...savedRatings,
        { activity: activityName, rating, comment },
      ]);

      setRating(0);
      setComment('');
    }
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>
          Rating Page
        </Text>

        <Text variant="bodyLarge" style={styles.text}>
          Activity: {activity || 'Unknown Activity'}
        </Text>

        <Text variant="bodyLarge" style={styles.text}>
          Rate this activity:
        </Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((num) => (
            <Pressable key={num} onPress={() => setRating(num)}>
              <Text style={[styles.star, { color: theme.colors.primary }]}>
                {rating >= num ? '★' : '☆'}
              </Text>
            </Pressable>
          ))}
        </View>

        <Text variant="titleMedium" style={styles.result}>
          Current rating: {rating} / 5
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Write a comment about this activity..."
          value={comment}
          onChangeText={setComment}
          multiline
        />

        <Button mode="contained" onPress={handleSubmit} style={styles.button}>
          Submit Rating
        </Button>

        {submittedMessage !== '' && (
          <Text variant="bodyLarge" style={styles.message}>
            {submittedMessage}
          </Text>
        )}

        <Divider style={styles.divider} />

        <Text variant="titleLarge" style={styles.savedTitle}>
          Saved Ratings
        </Text>

        {savedRatings.length === 0 ? (
          <Text variant="bodyMedium">No ratings submitted yet.</Text>
        ) : (
          savedRatings.map((item, index) => (
            <Text key={index} variant="bodyMedium" style={styles.savedText}>
              {item.activity}: {item.rating}/5 — Comment: {item.comment}
            </Text>
          ))
        )}

        <Button
          mode="contained-tonal"
          icon="format-list-bulleted"
          style={styles.button}
          onPress={() => router.push('/(tabs)/activity')}
        >
          Back to Activities
        </Button>

        <Button
          mode="outlined"
          icon="home"
          onPress={() => router.push('/(tabs)')}
        >
          Return Home
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
    padding: 20,
    alignItems: 'center',
  },
  title: {
    marginBottom: 10,
  },
  text: {
    marginBottom: 10,
    textAlign: 'center',
  },
  starRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  star: {
    fontSize: 40,
    marginHorizontal: 5,
  },
  result: {
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#999',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    minHeight: 90,
    marginBottom: 20,
    backgroundColor: 'white',
  },
  button: {
    marginBottom: 20,
    width: '100%',
  },
  message: {
    marginBottom: 20,
    textAlign: 'center',
  },
  divider: {
    width: '100%',
    marginBottom: 16,
  },
  savedTitle: {
    marginBottom: 10,
  },
  savedText: {
    marginBottom: 5,
    textAlign: 'center',
  },
});
