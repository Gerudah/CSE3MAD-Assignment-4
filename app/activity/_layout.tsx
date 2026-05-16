import { useAppTheme } from '@/constants/ContextTheme';
import { Stack } from 'expo-router';

export default function ActivityLayout() {
  const { theme } = useAppTheme();
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.onSurface,
        headerTitleStyle: { color: theme.colors.onSurface },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="parachute" options={{ title: 'Parachute Drop Challenge' }} />
      <Stack.Screen name="parachute-setup" options={{ title: 'Activity Setup' }} />
      <Stack.Screen name="parachute-design" options={{ title: 'Design Prototype' }} />
      <Stack.Screen name="parachute-analyze" options={{ title: 'Analyze Video' }} />
      <Stack.Screen name="parachute-summary" options={{ title: 'Results' }} />
    </Stack>
  );
}
