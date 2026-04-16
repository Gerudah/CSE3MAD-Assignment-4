import { useAppTheme } from '@/constants/ContextTheme';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Button, Divider, Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RatingScreen() {
  const { activity } = useLocalSearchParams();
  const { theme } = useAppTheme();
  const [rating, setRating] = useState(0);
  const [submittedMessage, setSubmittedMessage] = useState('');
  const [savedRatings, setSavedRatings] = useState<
    { activity: string; rating: number }[]
  >([]);

  const handleSubmit = () => {
    if (rating === 0) {
      setSubmittedMessage('Please choose a rating first.');
      return;
    }
    const activityName = activity ? String(activity) : 'Unknown Activity';
    setSavedRatings([...savedRatings, { activity: activityName, rating }]);
    setSubmittedMessage(`Rating submitted for ${activityName}: ${rating}/5`);
    setRating(0);
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text variant="headlineLarge" style={styles.title}>Rating Page</Text>

        <Text variant="bodyLarge" style={styles.text}>
          Activity: {activity || 'Unknown Activity'}
        </Text>
        <Text variant="bodyLarge" style={styles.text}>Rate this activity:</Text>

        <View style={styles.starRow}>
          {[1, 2, 3, 4, 5].map((num) => (
            <Pressable key={num} onPress={() => setRating(num)}>
              <Text style={[styles.star, { color: theme.colors.primary }]}>{rating >= num ? '★' : '☆'}</Text>
            </Pressable>
          ))}
        </View>

        <Text variant="titleMedium" style={styles.result}>
          Current rating: {rating} / 5
        </Text>

        <Button mode="contained" onPress={handleSubmit} style={styles.button}>
          Submit Rating
        </Button>

        {submittedMessage !== '' && (
          <Text variant="bodyLarge" style={styles.message}>{submittedMessage}</Text>
        )}

        <Divider style={styles.divider} />

        <Text variant="titleLarge" style={styles.savedTitle}>Saved Ratings</Text>

        {savedRatings.length === 0 ? (
          <Text variant="bodyMedium">No ratings submitted yet.</Text>
        ) : (
          savedRatings.map((item, index) => (
            <Text key={index} variant="bodyMedium" style={styles.savedText}>
              {item.activity}: {item.rating}/5
            </Text>
          ))
        )}
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
  button: {
    marginBottom: 20,
    width: '100%',
  },
  message: {
    marginBottom: 20,
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
  },
});
