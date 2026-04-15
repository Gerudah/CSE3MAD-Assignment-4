import { useAppTheme } from '@/constants/ContextTheme';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Switch } from 'react-native-paper';

export default function LightDarkToggle() {
  const { isDark, toggleTheme } = useAppTheme();

  return (
    <View style={styles.surface}>
      
      <Switch value={isDark} onValueChange={toggleTheme} />
      <Icon source="theme-light-dark" size={24} />
    </View>
  );
}

const styles = StyleSheet.create({
  surface: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
