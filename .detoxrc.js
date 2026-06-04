/**
 * Detox E2E configuration
 *
 * Prerequisites:
 *   1. Build the dev-client APK first:
 *        cd android && gradlew.bat assembleDebug assembleAndroidTest -DtestBuildType=debug
 *        (or use: npx expo run:android --configuration debug)
 *   2. Start an Android emulator (AVD name must match device.avdName below).
 *   3. Run tests:  npm run test:e2e
 *
 * The AVD name 'Pixel_6_API_34' matches the default Expo-recommended emulator.
 * Change it to match your installed AVD: emulator -list-avds
 */

/** @type {import('@detox/types').DetoxConfig} */
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 120000 },
  },

  apps: {
    'android.debug': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/debug/app-debug.apk',
      build:
        'cd android && gradlew.bat app:assembleDebug app:assembleAndroidTest -DtestBuildType=debug',
      testBinaryPath:
        'android/app/build/outputs/apk/androidTest/debug/app-debug-androidTest.apk',
    },
  },

  devices: {
    emulator: {
      type: 'android.emulator',
      device: { avdName: 'Pixel_8_Pro' },
    },
  },

  configurations: {
    'android.emu.debug': {
      device: 'emulator',
      app: 'android.debug',
    },
  },
};
