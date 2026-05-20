// app.config.js — extends app.json and evaluates process.env at build time.
// app.json cannot interpolate environment variables (it is static JSON), so
// anything that needs a runtime env var must be set here instead.

module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      googleMaps: {
        // Reads EXPO_PUBLIC_GOOGLE_MAPS_API_KEY from .env (or the shell environment).
        // This is what actually makes Google Maps tiles render on Android.
        apiKey: process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY,
      },
    },
  },
});
