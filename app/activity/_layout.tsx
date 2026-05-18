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

      <Stack.Screen name="reaction-board" options={{ title: 'Reaction Board Challenge' }} />
      <Stack.Screen name="reaction-board-setup" options={{ title: 'Activity Setup' }} />
      <Stack.Screen name="reaction-board-test" options={{ title: 'Reaction Tests' }} />
      <Stack.Screen name="reaction-board-summary" options={{ title: 'Results' }} />

      <Stack.Screen name="breathing-pace" options={{ title: 'Breathing Pace Trainer' }} />
      <Stack.Screen name="breathing-pace-summary" options={{ title: 'Results' }} />
      <Stack.Screen name="breathing-pace-setup" options={{ title: 'Activity Setup' }} />
      <Stack.Screen name="breathing-pace-test" options={{ title: 'Breathing Test' }} />

      <Stack.Screen name="hand-fan" options={{ title: 'Hand Fan Challenge' }} />
      <Stack.Screen name="hand-fan-setup" options={{ title: 'Activity Setup' }} />
      <Stack.Screen name="hand-fan-test" options={{ title: 'Hand Fan Test' }} />
      <Stack.Screen name="hand-fan-summary" options={{ title: 'Results' }} />
    </Stack>
  );
}
