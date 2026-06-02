import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();

  if (current.status === 'granted') {
    return true;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

export async function scheduleChallengeReminder(secondsBeforeEnd: number) {
  if (Platform.OS === 'web') {
    return;
  }

  const hasPermission = await requestNotificationPermission();

  if (!hasPermission) {
    return;
  }

  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Challenge ending soon',
      body: 'Your timed STEMM challenge is about to finish. Record your result now.',
      sound: true,
    },
    trigger: {
  type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
  seconds: secondsBeforeEnd,
},
  });
}