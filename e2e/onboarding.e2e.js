/**
 * E2E tests — Onboarding flows to the home screen
 *
 * Four flows tested:
 *   1. Not logged in          → login screen is presented
 *   2. Sign up (new account)  → lands on Team Formation (logged in, no team)
 *   3. Create team flow       → lands on Home tab screen
 *   4. Login with existing    → lands on Home tab screen (logged in, has team)
 *
 * Prerequisites:
 *   - Metro bundler must be running:  npx expo start
 *   - Test accounts must exist in Firebase Auth:
 *       E2E_WITH_TEAM_EMAIL / E2E_WITH_TEAM_PASSWORD  (account already in a team)
 *
 * Run:  npm run test:e2e
 */

const { device, element, by, waitFor, expect: detoxExpect } = require('detox');

// ── expo-dev-client launch URL ─────────────────────────────────────────────────
// On Android emulator, the host machine is reachable at 10.0.2.2.
// Passing this URL as an intent bypasses the "Choose a server" picker and tells
// expo-dev-client to connect straight to Metro on the host.
const METRO_URL = 'http://10.0.2.2:8081';
const DEV_CLIENT_URL =
  `exp+stemmappfresh://expo-development-client/?url=${encodeURIComponent(METRO_URL)}`;

// ── Test account constants ─────────────────────────────────────────────────────
const WITH_TEAM_EMAIL = process.env.E2E_WITH_TEAM_EMAIL || 'e2e-withteam@labrats.test';
const WITH_TEAM_PASSWORD = process.env.E2E_WITH_TEAM_PASSWORD || 'TestPass123!';

// Unique email so each CI run creates a fresh account
const SIGNUP_EMAIL = `e2e-signup-${Date.now()}@labrats.test`;
const SIGNUP_PASSWORD = 'TestPass123!';
const TEAM_NAME = `E2E Team ${Date.now()}`;
const CREATOR_NAME = 'E2E Tester';

// ── Timeouts ───────────────────────────────────────────────────────────────────
// After a fresh launch (delete:true) the app must clear data, restart, connect
// to Metro, download the JS bundle, and resolve Firebase auth state.  Give it
// plenty of room before declaring a test failure.
const LAUNCH_TIMEOUT = 45000;   // first visible element after device.launchApp
const ACTION_TIMEOUT = 15000;   // navigation / Firestore results
const ASSERT_TIMEOUT = 5000;    // element already on screen

// ── Helpers ────────────────────────────────────────────────────────────────────

async function launchFresh(deleteData = false) {
  await device.launchApp({
    newInstance: true,
    delete: deleteData,
    url: DEV_CLIENT_URL,
    launchArgs: {
      // Firestore keeps a persistent long-poll (Listen/channel) connection open
      // permanently.  Without this blacklist Detox considers the app "busy" and
      // its idle-wait blocks every waitFor until the timeout expires.
      detoxURLBlacklistRegex: '\\(".*firestore\\.googleapis\\.com.*"\\)',
    },
  });
  // Dismiss the expo-dev-client "Development server connected" popup.
  await device.pressBack();
}

async function typeIntoInput(testID, text) {
  // replaceText sets the value directly without opening the soft keyboard,
  // avoiding Google Keyboard autocomplete / done-tick interference.
  await element(by.id(testID)).tap();
  await element(by.id(testID)).replaceText(text);
}

// Waits for any element — defaults differ depending on what we just did.
async function waitForElement(matcher, timeout = ACTION_TIMEOUT) {
  await waitFor(element(matcher)).toBeVisible().withTimeout(timeout);
}

// Convenience wrappers
const waitForById    = (id,   t) => waitForElement(by.id(id),     t);
const waitForByText  = (text, t) => waitForElement(by.text(text), t);

// After a fresh launch the auth loading overlay covers the screen until
// Firebase resolves the auth state.  We wait for "Welcome back" — it is the
// form heading that only appears once loading:false and the router has navigated
// to /login.  Paper Button testIDs are unreliable on Android New Architecture;
// we use by.text() for all button interactions instead.
async function waitForLoginScreen() {
  await waitForByText('Welcome back', LAUNCH_TIMEOUT);
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('Onboarding flows', () => {
  beforeAll(async () => {
    // Initial launch — just get the app running; individual flows control state.
    await launchFresh();
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  // ── Flow 1: Not logged in ────────────────────────────────────────────────────

  describe('Flow 1 — not logged in', () => {
    beforeAll(async () => {
      // Wipe AsyncStorage so the cached Firebase token is gone.
      await launchFresh(true);
    });

    it('shows the login screen on cold launch', async () => {
      await waitForLoginScreen();
      await detoxExpect(element(by.text('Sign In'))).toBeVisible();
    });

    it('shows an error when submitting without credentials', async () => {
      await element(by.text('Sign In')).tap();
      await waitForByText('Please enter your email and password.', ASSERT_TIMEOUT);
    });
  });

  // ── Flow 2: Sign up → lands on Team Formation (logged in, no team) ───────────

  describe('Flow 2 — sign up new account (logged in, no team)', () => {
    beforeAll(async () => {
      await launchFresh(true);
      await waitForLoginScreen();

      // Switch to sign-up mode
      await element(by.text("Don't have an account? Sign up")).tap();
      await waitForByText('Create account', ASSERT_TIMEOUT);

      // Fill sign-up form (replaceText bypasses the soft keyboard entirely)
      await typeIntoInput('email-input',            SIGNUP_EMAIL);
      await typeIntoInput('password-input',          SIGNUP_PASSWORD);
      await typeIntoInput('confirm-password-input',  SIGNUP_PASSWORD);
      // Dismiss keyboard before tapping the button
      await device.pressBack();

      await element(by.text('Create Account')).tap();
    });

    it('redirects a new user (no team) to Team Formation screen', async () => {
      await waitForById('team-formation-screen', ACTION_TIMEOUT);
      await detoxExpect(element(by.id('team-formation-screen'))).toBeVisible();
    });

    it('shows both Create Team and Join with Code tabs', async () => {
      // Paper SegmentedButtons text isn't always found by by.text() on Android
      // New Architecture — use the testID we added to each button instead.
      await waitForById('create-tab-btn', ASSERT_TIMEOUT);
      await waitForById('join-tab-btn',   ASSERT_TIMEOUT);
    });
  });

  // ── Flow 3: Create team → lands on Home tabs ─────────────────────────────────

  describe('Flow 3 — create team flow', () => {
    // Continues directly from Flow 2 (still on team-formation-screen)

    it('shows the join code screen after successfully creating a team', async () => {
      await waitForById('team-formation-screen', ASSERT_TIMEOUT);
      await typeIntoInput('creator-name-input', CREATOR_NAME);
      await typeIntoInput('team-name-input',    TEAM_NAME);
      await device.pressBack(); // dismiss keyboard before tapping
      // 'Create Team' appears twice: SegmentedButton tab (index 0) and submit
      // button (index 1).  Use atIndex(1) to target the submit button.
      await element(by.text('Create Team')).atIndex(1).tap();

      // Firestore write + server round-trip can take several seconds
      await waitForById('team-created-screen', ACTION_TIMEOUT);
      await detoxExpect(element(by.id('join-code-display'))).toBeVisible();
    });

    it('continues to the home tabs after tapping Continue to App', async () => {
      await element(by.text('Continue to App')).tap();
      await waitForByText('Home Page', ACTION_TIMEOUT);
    });
  });

  // ── Flow 4: Login with existing account that has a team → Home tabs ───────────

  describe('Flow 4 — existing account with team (logged in, has team)', () => {
    beforeAll(async () => {
      await launchFresh(true);
      await waitForLoginScreen();

      await typeIntoInput('email-input',    WITH_TEAM_EMAIL);
      await typeIntoInput('password-input', WITH_TEAM_PASSWORD);
      await device.pressBack(); // dismiss keyboard
      await element(by.text('Sign In')).tap();
    });

    it('goes directly to the home tabs without passing through Team Formation', async () => {
      // AuthContext reads the student profile from Firestore and sets teamId,
      // then AuthGuard navigates straight to /(tabs) — no team-formation step.
      await waitForByText('Home Page', LAUNCH_TIMEOUT);
      await detoxExpect(element(by.id('team-formation-screen'))).not.toBeVisible();
    });

    it('home screen renders the bottom tab bar', async () => {
      // Paper BottomNavigation renders every tab label twice (active + background),
      // so matching by text always hits 2 views.  Check the bar container instead.
      await waitForById('bottom-tab-bar', ASSERT_TIMEOUT);
    });
  });
});
