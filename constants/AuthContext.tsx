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
  setTeam: (id: string, name: string, member: string) => void;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue>({
  user: null,
  teamId: null,
  teamName: null,
  memberName: null,
  loading: true,
  setTeam: () => {},
  logout: async () => {},
});

const SESSION_HOURS = 12;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [teamId, setTeamId] = useState<string | null>(null);
  const [teamName, setTeamName] = useState<string | null>(null);
  const [memberName, setMemberName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
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

        // Try to load existing profile
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
          // Fall through to email lookup
        }

        // No profile — check if they were pre-added to a team by email
        if (firebaseUser.email) {
          try {
            const found = await findTeamByEmail(firebaseUser.email);
            if (found) {
              const defaultName =
                firebaseUser.displayName || firebaseUser.email.split('@')[0];
              await setDoc(doc(firestoreDb, 'students', firebaseUser.uid), {
                teamId: found.teamId,
                teamName: found.teamName,
                memberName: defaultName,
                updatedAt: Date.now(),
              });
              setTeamId(found.teamId);
              setTeamName(found.teamName);
              setMemberName(defaultName);
            } else {
              setTeamId(null);
              setTeamName(null);
              setMemberName(null);
            }
          } catch {
            setTeamId(null);
            setTeamName(null);
            setMemberName(null);
          }
        }

        setUser(firebaseUser);
      } else {
        setUser(null);
        setTeamId(null);
        setTeamName(null);
        setMemberName(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const setTeam = (id: string, name: string, member: string) => {
    setTeamId(id);
    setTeamName(name);
    setMemberName(member);
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, teamId, teamName, memberName, loading, setTeam, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
