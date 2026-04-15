import React, { createContext, useContext } from 'react';
import { Platform } from 'react-native';
import {
  MD3LightTheme,
  MD3DarkTheme,
  PaperProvider,
  type MD3Theme,
} from 'react-native-paper';
import { useColorScheme } from '@/hooks/use-color-scheme';

// ─── Light: high-contrast MD3 purple, never pure white ───────────────────────

const lightColors: MD3Theme['colors'] = {
  ...MD3LightTheme.colors,

  // Brand
  primary: '#4A0082',
  onPrimary: '#F5F0FF',
  primaryContainer: '#C4A0FF',
  onPrimaryContainer: '#21005E',

  secondary: '#6B2FA0',
  onSecondary: '#F5F0FF',
  secondaryContainer: '#DDB8FF',
  onSecondaryContainer: '#2D004F',

  tertiary: '#7E4898',
  onTertiary: '#F5F0FF',
  tertiaryContainer: '#F2DAFF',
  onTertiaryContainer: '#2A0043',

  // Error
  error: '#BA1A1A',
  onError: '#F5F0FF',
  errorContainer: '#FFDAD6',
  onErrorContainer: '#410002',

  // Backgrounds & surfaces — off-white purple tints, never #FFFFFF
  background: '#F5F0FF',
  onBackground: '#1B0033',
  surface: '#EDE5FF',
  onSurface: '#1B0033',
  surfaceVariant: '#E8DEFF',
  onSurfaceVariant: '#4A4358',

  // Outlines
  outline: '#6A5C7A',
  outlineVariant: '#C9BADA',

  // Inverse / utility
  inverseSurface: '#2C1852',
  inverseOnSurface: '#F5F0FF',
  inversePrimary: '#CF9FFF',
  shadow: '#000000',
  scrim: '#000000',

  // Disabled & backdrop
  surfaceDisabled: 'rgba(27, 0, 51, 0.12)',
  onSurfaceDisabled: 'rgba(27, 0, 51, 0.38)',
  backdrop: 'rgba(49, 21, 77, 0.40)',

  // Elevation tints (paper uses these for surface tinting)
  elevation: {
    level0: 'transparent',
    level1: '#EBE2FF',
    level2: '#E4D8FF',
    level3: '#DCCEFF',
    level4: '#D9CAFF',
    level5: '#D3C2FF',
  },
};

// ─── Dark: high-contrast MD3 purple, never pure black ────────────────────────

const darkColors: MD3Theme['colors'] = {
  ...MD3DarkTheme.colors,

  // Brand
  primary: '#CF9FFF',
  onPrimary: '#380060',
  primaryContainer: '#5200A3',
  onPrimaryContainer: '#EEDCFF',

  secondary: '#D4AAFF',
  onSecondary: '#4A007A',
  secondaryContainer: '#621DA4',
  onSecondaryContainer: '#EEDCFF',

  tertiary: '#E5B8FF',
  onTertiary: '#4A006A',
  tertiaryContainer: '#62208E',
  onTertiaryContainer: '#FCDCFF',

  // Error
  error: '#FFB4AB',
  onError: '#690005',
  errorContainer: '#93000A',
  onErrorContainer: '#FFDAD6',

  // Backgrounds & surfaces — deep dark purple, never #000000
  background: '#120021',
  onBackground: '#EEDCFF',
  surface: '#1B0035',
  onSurface: '#EEDCFF',
  surfaceVariant: '#2E1A45',
  onSurfaceVariant: '#CABEDE',

  // Outlines
  outline: '#9680AF',
  outlineVariant: '#4A3B5C',

  // Inverse / utility
  inverseSurface: '#EEDCFF',
  inverseOnSurface: '#2C1852',
  inversePrimary: '#4A0082',
  shadow: '#000000',
  scrim: '#000000',

  // Disabled & backdrop
  surfaceDisabled: 'rgba(238, 220, 255, 0.12)',
  onSurfaceDisabled: 'rgba(238, 220, 255, 0.38)',
  backdrop: 'rgba(49, 21, 77, 0.40)',

  // Elevation tints
  elevation: {
    level0: 'transparent',
    level1: '#230040',
    level2: '#290049',
    level3: '#300055',
    level4: '#320058',
    level5: '#370062',
  },
};

// ─── Composed themes ──────────────────────────────────────────────────────────

export const AppLightTheme: MD3Theme = {
  ...MD3LightTheme,
  colors: lightColors,
};

export const AppDarkTheme: MD3Theme = {
  ...MD3DarkTheme,
  colors: darkColors,
};

// ─── Context ──────────────────────────────────────────────────────────────────

type ThemeContextValue = {
  theme: MD3Theme;
  isDark: boolean;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: AppLightTheme,
  isDark: false,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const scheme = useColorScheme();
  const [isDark, setIsDark] = React.useState(scheme === 'dark');
  const theme = isDark ? AppDarkTheme : AppLightTheme;

  const toggleTheme = () => setIsDark(prev => !prev);

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      <PaperProvider theme={theme}>{children}</PaperProvider>
    </ThemeContext.Provider>
  );
}

/** Returns the active MD3 theme and a boolean indicating dark mode. */
export function useAppTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}

// ─── Backward-compat exports (mirrors the old theme.ts shape) ────────────────

export const Colors = {
  light: {
    text: lightColors.onBackground,
    background: lightColors.background,
    tint: lightColors.primary,
    icon: lightColors.onSurfaceVariant,
    tabIconDefault: lightColors.onSurfaceVariant,
    tabIconSelected: lightColors.primary,
  },
  dark: {
    text: darkColors.onBackground,
    background: darkColors.background,
    tint: darkColors.primary,
    icon: darkColors.onSurfaceVariant,
    tabIconDefault: darkColors.onSurfaceVariant,
    tabIconSelected: darkColors.primary,
  },
};

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
