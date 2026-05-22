import { auth, db as firestoreDb } from '@/firebaseConfig';
import { findTeamByEmail } from '@/services/teamService';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthContextValue = {
  user: User | null;
  teamId: string | null;
  teamName: string | null;
  memberName: string | null;
  loading: boolean;
  findingTeam: boolean;
  setTeam: (id: string, name: string, member: string) => void;
  clearTeam: () => void;
  updateName: (name: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  teamId: null,
  teamName: null,
  memberName: null,
  loading: true,
  findingTeam: false,
  setTeam: () => {},
  clearTeam: () => {},
  updateName: () => {},
  logout: async () => {},
});

const SESSION_HOURS = 12;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [findingTeam, setFindingTeam] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setLoading(true); // cover the screen while we fetch profile data
        // 12-hour session check
        const lastSignIn = new Date(firebaseUser.metadata.lastSignInTime ?? 0);
        const hoursSince = (Date.now() - lastSignIn.getTime()) / (1000 * 60 * 60);
        if (hoursSince > SESSION_HOURS) {
          await signOut(auth);
          setUser(null);
          setTeamId(null);
          setTeamName(null);
          setMemberName(null);
          setLoading(false);
          return;
        }

        // Try to load existing profile — this is the only blocking Firestore call
        try {
          const snap = await getDoc(doc(firestoreDb, 'students', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            setTeamId(data.teamId ?? null);
            setTeamName(data.teamName ?? null);
            setMemberName(data.memberName ?? null);
            setUser(firebaseUser);
            setLoading(false);
            return;
          }
        } catch {
          // Fall through
        }

        // No profile yet — unblock the UI immediately, then search for a pre-added team in background
        setUser(firebaseUser);
        setTeamId(null);
        setTeamName(null);
        setMemberName(null);
        setLoading(false);

        if (firebaseUser.email) {
          setFindingTeam(true);
          const email = firebaseUser.email;
          findTeamByEmail(email)
            .then(async (found) => {
              if (!found) return;
              const defaultName = firebaseUser.displayName || email.split('@')[0];
              await setDoc(doc(firestoreDb, 'students', firebaseUser.uid), {
                teamId: found.teamId,
                teamName: found.teamName,
                memberName: defaultName,
                updatedAt: Date.now(),
              });
              setTeamId(found.teamId);
              setTeamName(found.teamName);
              setMemberName(defaultName);
            })
            .catch(() => {})
            .finally(() => setFindingTeam(false));
        }
      } else {
        setUser(null);
        setTeamId(null);
        setTeamName(null);
        setMemberName(null);
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const setTeam = (id: string, name: string, member: string) => {
    setTeamId(id);
    setTeamName(name);
    setMemberName(member);
  };

  const clearTeam = () => {
    setTeamId(null);
    setTeamName(null);
    setMemberName(null);
  };

  const updateName = (name: string) => {
    setMemberName(name);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, teamId, teamName, memberName, loading, findingTeam, setTeam, clearTeam, updateName, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
