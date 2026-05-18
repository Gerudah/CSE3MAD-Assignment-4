import { db } from '@/firebaseConfig';
import {
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from 'firebase/firestore';

function generateJoinCode(): string {
  // Unambiguous chars — no 0/O, 1/I/L
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateTeamId(teamName: string): string {
  const slug = teamName.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
  const suffix = Math.random().toString(36).substring(2, 6);
  return `${slug}-${suffix}`;
}

export async function createTeam(params: {
  teamName: string;
  memberEmails: string[];
  creatorUid: string;
  creatorEmail: string;
  creatorName: string;
}): Promise<{ teamId: string; joinCode: string }> {
  const { teamName, memberEmails, creatorUid, creatorEmail, creatorName } = params;
  const teamId = generateTeamId(teamName);
  const joinCode = generateJoinCode();

  const allEmails = Array.from(
    new Set([creatorEmail, ...memberEmails].map(e => e.toLowerCase().trim()).filter(Boolean))
  );

  await setDoc(doc(db, 'teams', teamId), {
    team_name: teamName.trim(),
    join_code: joinCode,
    created_by_uid: creatorUid,
    created_at: Date.now(),
    member_emails: allEmails,
  });

  await setDoc(doc(db, 'students', creatorUid), {
    teamId,
    teamName: teamName.trim(),
    memberName: creatorName.trim(),
    updatedAt: Date.now(),
  });

  return { teamId, joinCode };
}

export async function joinTeamByCode(params: {
  joinCode: string;
  uid: string;
  email: string;
  memberName: string;
}): Promise<{ teamId: string; teamName: string }> {
  const { joinCode, uid, email, memberName } = params;

  const q = query(
    collection(db, 'teams'),
    where('join_code', '==', joinCode.toUpperCase().trim())
  );
  const snap = await getDocs(q);
  if (snap.empty) throw new Error('Team not found. Check your join code.');

  const teamDoc = snap.docs[0];
  const teamId = teamDoc.id;
  const data = teamDoc.data();
  const normalizedEmail = email.toLowerCase().trim();

  await setDoc(doc(db, 'teams', teamId), { member_emails: arrayUnion(normalizedEmail) }, { merge: true });

  await setDoc(doc(db, 'students', uid), {
    teamId,
    teamName: data.team_name,
    memberName: memberName.trim(),
    updatedAt: Date.now(),
  });

  return { teamId, teamName: data.team_name };
}

export async function findTeamByEmail(
  email: string
): Promise<{ teamId: string; teamName: string } | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const q = query(
    collection(db, 'teams'),
    where('member_emails', 'array-contains', normalizedEmail)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const data = snap.docs[0].data();
  return { teamId: snap.docs[0].id, teamName: data.team_name };
}
