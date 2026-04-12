import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerTitleAlign: 'center' }}>
      <Stack.Screen name="login" options={{ title: 'Login' }} />
      <Stack.Screen name="team-formation" options={{ title: 'Team Formation' }} />
      <Stack.Screen name="rating" options={{ title: 'Rating' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}