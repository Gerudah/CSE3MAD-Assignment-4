import { useAuth } from "@/constants/AuthContext";
import { db } from "@/firebaseConfig";
import { useFocusEffect, router } from "expo-router";
import { collection, getDocs } from "firebase/firestore";
import { useCallback, useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

type RatingSummary = { avg: number; count: number };

const ACTIVITY_ROUTES: Record<number, string> = {
    1: "/activity/parachute",
    2: "/activity/sound-pollution",
    3: "/activity/hand-fan",
    4: "/activity/earthquake",
    5: "/activity/stretch-speed",
    6: "/activity/reaction-board",
    7: "/activity/breathing-pace",
};

const activities = [
    {
        id: 1,
        category: "Engineering Challenges",
        name: "Parachute Drop Challenge",
        description: "Design and test a parachute to slow the fall of an object.",
        difficulty: "Medium",
        duration: "20 mins",
    },
    {
        id: 2,
        category: "Engineering Challenges",
        name: "Sound Pollution Hunter",
        description: "Investigate noise levels in different environments and record findings.",
        difficulty: "Easy",
        duration: "15 mins",
    },
    {
        id: 3,
        category: "Engineering Challenges",
        name: "Hand Fan Challenge",
        description: "Create a hand fan design that produces the strongest airflow.",
        difficulty: "Easy",
        duration: "15 mins",
    },
    {
        id: 4,
        category: "Engineering Challenges",
        name: "Earthquake-Resistance Structure",
        description: "Build a structure that can better withstand shaking and movement.",
        difficulty: "Hard",
        duration: "30 mins",
    },
    {
        id: 5,
        category: "Health and Medical Sciences",
        name: "Human Performance Lab - Stretch, Speed and Gracefulness",
        description: "Explore flexibility, movement speed and coordination through physical testing.",
        difficulty: "Medium",
        duration: "25 mins",
    },
    {
        id: 6,
        category: "Health and Medical Sciences",
        name: "Reaction Board Challenge",
        description: "Measure reaction speed using a response board or quick movement task.",
        difficulty: "Medium",
        duration: "15 mins",
    },
    {
        id: 7,
        category: "Health and Medical Sciences",
        name: "Breathing Pace Trainer",
        description: "Practice controlled breathing and monitor pace during activity or rest.",
        difficulty: "Easy",
        duration: "10 mins",
    },
];

function starString(avg: number): string {
    return [1, 2, 3, 4, 5].map(i => avg >= i - 0.25 ? '★' : '☆').join('');
}

export default function ActivityScreen() {
    const { teamId } = useAuth();
    const [ratings, setRatings] = useState<Record<string, RatingSummary>>({});

    useFocusEffect(
        useCallback(() => {
            let active = true;
            getDocs(collection(db, 'ratings'))
                .then(snapshot => {
                    if (!active) return;
                    const totals: Record<string, { sum: number; count: number }> = {};
                    snapshot.forEach(doc => {
                        const { activity, rating } = doc.data() as { activity: string; rating: number };
                        if (!activity || typeof rating !== 'number') return;
                        if (!totals[activity]) totals[activity] = { sum: 0, count: 0 };
                        totals[activity].sum += rating;
                        totals[activity].count += 1;
                    });
                    const summaries: Record<string, RatingSummary> = {};
                    for (const [name, { sum, count }] of Object.entries(totals)) {
                        summaries[name] = { avg: sum / count, count };
                    }
                    setRatings(summaries);
                })
                .catch(() => {});
            return () => { active = false; };
        }, [])
    );

    function startActivity(path: string) {
        if (!teamId) {
            router.push("/team-formation");
            return;
        }
        router.push(path as any);
    }

    return (
        <SafeAreaView style={styles.safe}>
            <ScrollView contentContainerStyle={styles.container}>
                <Text variant="headlineLarge" style={styles.title}>
                    Activities
                </Text>
                <Text variant="bodyLarge" style={styles.subtitle}>
                    Choose a STEMM activity below.
                </Text>

                {activities.map((activity) => {
                    const r = ratings[activity.name];
                    return (
                        <Card key={activity.id} style={styles.card}>
                            <Card.Content>
                                <Text variant="labelLarge" style={styles.category}>
                                    {activity.category}
                                </Text>
                                <Text variant="titleLarge" style={styles.activityName}>
                                    {activity.name}
                                </Text>
                                <Text variant="bodyMedium" style={styles.description}>
                                    {activity.description}
                                </Text>
                                <Text variant="bodyMedium">
                                    Difficulty: {activity.difficulty}
                                </Text>
                                <Text variant="bodyMedium">
                                    Duration: {activity.duration}
                                </Text>
                                <View style={styles.ratingRow}>
                                    {r ? (
                                        <>
                                            <Text style={styles.stars}>{starString(r.avg)}</Text>
                                            <Text variant="bodyMedium" style={styles.ratingText}>
                                                {r.avg.toFixed(1)} · {r.count} {r.count === 1 ? 'rating' : 'ratings'}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text variant="bodySmall" style={styles.noRating}>
                                            No ratings yet
                                        </Text>
                                    )}
                                </View>
                            </Card.Content>
                            <Card.Actions>
                                <Button
                                    mode="contained"
                                    onPress={() => startActivity(ACTIVITY_ROUTES[activity.id])}
                                >
                                    Start Activity
                                </Button>
                            </Card.Actions>
                        </Card>
                    );
                })}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safe: { flex: 1 },
    container: { padding: 20 },
    title: { marginBottom: 10, textAlign: "center" },
    subtitle: { marginBottom: 20, textAlign: "center" },
    card: { marginBottom: 15 },
    category: { marginBottom: 6 },
    activityName: { marginBottom: 8 },
    description: { marginBottom: 4 },
    ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8 },
    stars: { fontSize: 16, color: '#FFC107', letterSpacing: 1 },
    ratingText: { opacity: 0.75 },
    noRating: { opacity: 0.5, marginTop: 8 },
});
