/**
 * E2E tests — Onboarding flows to the home screen
 *
 * Four flows tested:
 *   1. Not logged in          → login screen is presented
 *   2. Sign up (new account)  → lands on Team Formation (logged in, no team)
 *   3. Create team flow       → lands on Home tab screen
 *   4. Login with existing    → lands on Home tab screen (logged in, has team)
 *
 * Test accounts must exist in Firebase Auth (or the Auth emulator):
 *   WITH_TEAM_EMAIL / WITH_TEAM_PASSWORD   — account pre-assigned to a team
 *
 * A fresh disposable account is created inline for the sign-up + create-team flow.
 *
 * Run:  npm run test:e2e
 */

const { device, element, by, waitFor, expect: detoxExpect } = require('detox');

// ── Test account constants ─────────────────────────────────────────────────────
const WITH_TEAM_EMAIL = process.env.E2E_WITH_TEAM_EMAIL || 'e2e-withteam@labrats.test';
const WITH_TEAM_PASSWORD = process.env.E2E_WITH_TEAM_PASSWORD || 'TestPass123!';

// Unique email so each CI run creates a fresh account
const SIGNUP_EMAIL = `e2e-signup-${Date.now()}@labrats.test`;
const SIGNUP_PASSWORD = 'TestPass123!';
const TEAM_NAME = `E2E Team ${Date.now()}`;
const CREATOR_NAME = 'E2E Tester';

// ── Helpers ────────────────────────────────────────────────────────────────────

async function typeIntoInput(testID, text) {
  await element(by.id(testID)).tap();
  await element(by.id(testID)).clearText();
  await element(by.id(testID)).typeText(text);
}

async function waitForScreen(testID, timeout = 10000) {
  await waitFor(element(by.id(testID)))
    .toBeVisible()
    .withTimeout(timeout);
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe('Onboarding flows', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  // ── Flow 1: Not logged in ────────────────────────────────────────────────────

  describe('Flow 1 — not logged in', () => {
    beforeAll(async () => {
      // Clear all stored credentials to guarantee a logged-out state
      await device.launchApp({ newInstance: true, delete: true });
    });

    it('shows the login screen on cold launch', async () => {
      await waitForScreen('login-screen');
      await detoxExpect(element(by.id('auth-submit-btn'))).toBeVisible();
    });

    it('shows an error when submitting without credentials', async () => {
      await element(by.id('auth-submit-btn')).tap();
      await waitFor(element(by.text('Please enter your email and password.')))
        .toBeVisible()
        .withTimeout(3000);
    });
  });

  // ── Flow 2: Sign up → lands on Team Formation (logged in, no team) ───────────

  describe('Flow 2 — sign up new account (logged in, no team)', () => {
    beforeAll(async () => {
      await device.launchApp({ newInstance: true, delete: true });
      await waitForScreen('login-screen');

      // Switch to sign-up mode
      await element(by.id('toggle-auth-mode-btn')).tap();
      await waitFor(element(by.text('Create account'))).toBeVisible().withTimeout(3000);

      // Fill sign-up form
      await typeIntoInput('email-input', SIGNUP_EMAIL);
      await typeIntoInput('password-input', SIGNUP_PASSWORD);
      await typeIntoInput('confirm-password-input', SIGNUP_PASSWORD);

      await element(by.id('auth-submit-btn')).tap();
    });

    it('redirects a new user (no team) to Team Formation screen', async () => {
      await waitForScreen('team-formation-screen', 15000);
      await detoxExpect(element(by.id('team-formation-screen'))).toBeVisible();
    });

    it('shows both Create Team and Join with Code tabs', async () => {
      await detoxExpect(element(by.text('Create Team'))).toBeVisible();
      await detoxExpect(element(by.text('Join with Code'))).toBeVisible();
    });
  });

  // ── Flow 3: Create team → lands on Home tabs ─────────────────────────────────

  describe('Flow 3 — create team flow', () => {
    // Continues from Flow 2 (still on team-formation-screen after sign-up)

    beforeAll(async () => {
      // Ensure we are on the team-formation screen from the previous flow
      await waitForScreen('team-formation-screen', 5000);
    });

    it('shows the join code screen after successfully creating a team', async () => {
      await typeIntoInput('creator-name-input', CREATOR_NAME);
      await typeIntoInput('team-name-input', TEAM_NAME);
      await element(by.id('create-team-btn')).tap();

      // Team creation may take a moment (Firestore write)
      await waitForScreen('team-created-screen', 15000);
      await detoxExpect(element(by.id('join-code-display'))).toBeVisible();
    });

    it('continues to the home tabs after tapping Continue to App', async () => {
      await element(by.id('continue-to-app-btn')).tap();

      // The (tabs) navigator shows an Explore tab
      await waitFor(element(by.text('Explore')))
        .toBeVisible()
        .withTimeout(10000);
    });
  });

  // ── Flow 4: Login with existing account that has a team → Home tabs ───────────

  describe('Flow 4 — existing account with team (logged in, has team)', () => {
    beforeAll(async () => {
      // Fresh launch so there's no cached session from the sign-up flows above
      await device.launchApp({ newInstance: true, delete: true });
      await waitForScreen('login-screen');

      await typeIntoInput('email-input', WITH_TEAM_EMAIL);
      await typeIntoInput('password-input', WITH_TEAM_PASSWORD);
      await element(by.id('auth-submit-btn')).tap();
    });

    it('goes directly to the home tabs without passing through Team Formation', async () => {
      // AuthContext loads the profile and AuthGuard routes straight to /(tabs)
      await waitFor(element(by.text('Explore')))
        .toBeVisible()
        .withTimeout(15000);

      // Confirm the team-formation screen is NOT shown
      await detoxExpect(element(by.id('team-formation-screen'))).not.toBeVisible();
    });

    it('home screen shows the Explore, Activities and Leaderboard tabs', async () => {
      await detoxExpect(element(by.text('Explore'))).toBeVisible();
      await detoxExpect(element(by.text('Activities'))).toBeVisible();
      await detoxExpect(element(by.text('Leaderboard'))).toBeVisible();
    });
  });
});
