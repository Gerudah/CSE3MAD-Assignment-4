import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function RatingScreen() {
  const { activity } = useLocalSearchParams();

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

    setSavedRatings([
      ...savedRatings,
      { activity: activityName, rating: rating },
    ]);

    setSubmittedMessage(`Rating submitted for ${activityName}: ${rating}/5`);
    setRating(0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Rating Page</Text>

      {/* Activity Name */}
      <Text style={styles.text}>
        Activity: {activity || 'Unknown Activity'}
      </Text>

      <Text style={styles.text}>Rate this activity:</Text>

      {/* Stars */}
      <View style={styles.starRow}>
        {[1, 2, 3, 4, 5].map((num) => (
          <Pressable key={num} onPress={() => setRating(num)}>
            <Text style={styles.star}>
              {rating >= num ? '★' : '☆'}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.result}>Current rating: {rating} / 5</Text>

      {/* Submit Button */}
      <Pressable style={styles.button} onPress={handleSubmit}>
        <Text style={styles.buttonText}>Submit Rating</Text>
      </Pressable>

      {/* Message */}
      {submittedMessage !== '' && (
        <Text style={styles.message}>{submittedMessage}</Text>
      )}

      {/* Saved Ratings */}
      <Text style={styles.savedTitle}>Saved Ratings</Text>

      {savedRatings.length === 0 ? (
        <Text style={styles.savedText}>No ratings submitted yet.</Text>
      ) : (
        savedRatings.map((item, index) => (
          <Text key={index} style={styles.savedText}>
            {item.activity}: {item.rating}/5
          </Text>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  text: {
    fontSize: 18,
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
    fontSize: 20,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  message: {
    fontSize: 18,
    marginBottom: 20,
  },
  savedTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  savedText: {
    fontSize: 18,
    marginBottom: 5,
  },
});