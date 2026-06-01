/**
 * Integration tests — Firestore write/read round-trip via teamService
 *
 * These tests exercise the full service → Firestore path using the Firebase
 * Local Emulator Suite instead of production Firestore.
 *
 * Prerequisites:
 *   1. Install the Firebase CLI:  npm install -g firebase-tools
 *   2. Start the Firestore emulator:
 *        firebase emulators:start --only firestore
 *      (default host: localhost:8080)
 *   3. Run:  npm run test:integration
 *
 * The tests create real Firestore documents, read them back, and assert that
 * the data round-trips correctly through createTeam / joinTeamByCode /
 * findTeamByEmail.
 */

import { deleteApp, initializeApp } from 'firebase/app';
import type { FirebaseApp } from 'firebase/app';
import {
  clearIndexedDbPersistence,
  connectFirestoreEmulator,
  getFirestore,
  terminate,
} from 'firebase/firestore';
import type { Firestore } from 'firebase/firestore';

// ── Emulator config ────────────────────────────────────────────────────────────
const EMULATOR_HOST = process.env.FIRESTORE_EMULATOR_HOST?.split(':')[0] ?? 'localhost';
const EMULATOR_PORT = parseInt(
  process.env.FIRESTORE_EMULATOR_HOST?.split(':')[1] ?? '8080',
  10
);
const TEST_PROJECT_ID = 'labrats-integration-test';

// ── Lazy getter: injects the emulator Firestore into teamService ──────────────
//
// teamService imports `db` from @/firebaseConfig at module load time.
// TypeScript/CommonJS compiles `import { db } from '...'` to access the
// module object's `db` property on each use — so a getter is evaluated
// lazily and returns the emulator instance once it's ready.
let firestoreInstance: Firestore;

jest.mock('@/firebaseConfig', () => ({
  get db() {
    return firestoreInstance;
  },
  auth: {},
  storage: null,
  default: null,
}));

// Import after the mock is registered (jest.mock hoisting ensures the mock
// is in place before any module's factory function runs).
import { createTeam, findTeamByEmail, joinTeamByCode } from '@/services/teamService';

// ── Test lifecycle ─────────────────────────────────────────────────────────────

let testApp: FirebaseApp;

beforeAll(() => {
  // Use a unique app name so parallel test files don't collide
  testApp = initializeApp({ projectId: TEST_PROJECT_ID }, `test-${Date.now()}`);
  firestoreInstance = getFirestore(testApp);
  connectFirestoreEmulator(firestoreInstance, EMULATOR_HOST, EMULATOR_PORT);
});

afterAll(async () => {
  await terminate(firestoreInstance);
  await deleteApp(testApp);
});

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Unique suffix prevents collisions between test runs */
function uid(label: string) {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe('teamService — Firestore write/read round-trip', () => {

  // ── createTeam ─────────────────────────────────────────────────────────────

  describe('createTeam', () => {
    it('returns a teamId and a 6-character alphanumeric join code', async () => {
      const result = await createTeam({
        teamName: 'Round-trip Team A',
        memberEmails: [],
        creatorUid: uid('creator'),
        creatorEmail: `creator-${uid('a')}@test.edu.au`,
        creatorName: 'Alice',
      });

      expect(result.teamId).toBeTruthy();
      expect(result.joinCode).toHaveLength(6);
      expect(result.joinCode).toMatch(/^[A-Z2-9]+$/);
    });

    it('writes the team document so findTeamByEmail can read it back', async () => {
      const memberEmail = `member-${uid('b')}@test.edu.au`;
      const creatorEmail = `creator-${uid('b')}@test.edu.au`;

      const { teamId } = await createTeam({
        teamName: 'Round-trip Team B',
        memberEmails: [memberEmail],
        creatorUid: uid('uid-b'),
        creatorEmail,
        creatorName: 'Bob',
      });

      // Read the team back via the member email (mirrors findTeamByEmail query)
      const found = await findTeamByEmail(memberEmail);

      expect(found).not.toBeNull();
      expect(found!.teamId).toBe(teamId);
      expect(found!.teamName).toBe('Round-trip Team B');
    });

    it('normalises member emails to lowercase before writing', async () => {
      const rawEmail = `Mixed.Case-${uid('c')}@Test.Edu.Au`;
      const normalised = rawEmail.toLowerCase();

      await createTeam({
        teamName: 'Round-trip Team C',
        memberEmails: [rawEmail],
        creatorUid: uid('uid-c'),
        creatorEmail: `creator-${uid('c')}@test.edu.au`,
        creatorName: 'Carol',
      });

      // findTeamByEmail also normalises, so this must round-trip
      const found = await findTeamByEmail(normalised);
      expect(found).not.toBeNull();
    });

    it('deduplicates creator email and member emails', async () => {
      const sharedEmail = `shared-${uid('d')}@test.edu.au`;

      const { teamId } = await createTeam({
        teamName: 'Round-trip Team D',
        // Creator email appears in memberEmails too — should be deduplicated
        memberEmails: [sharedEmail],
        creatorUid: uid('uid-d'),
        creatorEmail: sharedEmail,
        creatorName: 'Dave',
      });

      // Still findable by the shared email
      const found = await findTeamByEmail(sharedEmail);
      expect(found!.teamId).toBe(teamId);
    });
  });

  // ── findTeamByEmail ─────────────────────────────────────────────────────────

  describe('findTeamByEmail', () => {
    it('returns null when no team contains the given email', async () => {
      const result = await findTeamByEmail(`nobody-${uid('x')}@test.edu.au`);
      expect(result).toBeNull();
    });

    it('returns the correct team when multiple teams exist', async () => {
      const emailA = `search-a-${uid('e')}@test.edu.au`;
      const emailB = `search-b-${uid('f')}@test.edu.au`;

      const { teamId: idA } = await createTeam({
        teamName: 'Search Team A',
        memberEmails: [emailA],
        creatorUid: uid('uid-e'),
        creatorEmail: `creator-${uid('e')}@test.edu.au`,
        creatorName: 'Eve',
      });
      await createTeam({
        teamName: 'Search Team B',
        memberEmails: [emailB],
        creatorUid: uid('uid-f'),
        creatorEmail: `creator-${uid('f')}@test.edu.au`,
        creatorName: 'Frank',
      });

      const found = await findTeamByEmail(emailA);
      expect(found!.teamId).toBe(idA);
      expect(found!.teamName).toBe('Search Team A');
    });
  });

  // ── joinTeamByCode ──────────────────────────────────────────────────────────

  describe('joinTeamByCode', () => {
    it('adds a joiner and writes their student profile; findTeamByEmail returns the team', async () => {
      const joinerEmail = `joiner-${uid('g')}@test.edu.au`;
      const joinerUid = uid('uid-g');

      // 1. Create a team first
      const { joinCode, teamId } = await createTeam({
        teamName: 'Join Test Team',
        memberEmails: [],
        creatorUid: uid('uid-creator-g'),
        creatorEmail: `creator-${uid('g')}@test.edu.au`,
        creatorName: 'Grace',
      });

      // 2. Joiner uses the code
      const result = await joinTeamByCode({
        joinCode,
        uid: joinerUid,
        email: joinerEmail,
        memberName: 'Hank',
      });

      expect(result.teamId).toBe(teamId);
      expect(result.teamName).toBe('Join Test Team');

      // 3. Read back: joiner email should now appear in the team
      const found = await findTeamByEmail(joinerEmail);
      expect(found).not.toBeNull();
      expect(found!.teamId).toBe(teamId);
    });

    it('throws when the join code does not match any team', async () => {
      await expect(
        joinTeamByCode({
          joinCode: 'XXXXXX',
          uid: uid('uid-h'),
          email: `nobody-${uid('h')}@test.edu.au`,
          memberName: 'Ivy',
        })
      ).rejects.toThrow('Team not found');
    });
  });
});