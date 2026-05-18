import { auth, db as firestoreDb } from '@/firebaseConfig';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
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

        try {
          const snap = await getDoc(doc(firestoreDb, 'user_profiles', firebaseUser.uid));
          if (snap.exists()) {
            const data = snap.data();
            setTeamId(data.team_id ?? null);
            setTeamName(data.team_name ?? null);
            setMemberName(data.member_name ?? null);
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
