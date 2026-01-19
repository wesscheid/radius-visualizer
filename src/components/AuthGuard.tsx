import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { signInAnonymously, getRedirectResult } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useStore, Radius, Group } from '../store/useStore';
import { Loader2 } from 'lucide-react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const { setRadii, setGroups, setLoading } = useStore();

  useEffect(() => {
    const initAuth = async () => {
      if (!loading && !user) {
        try {
          // Check if we are returning from a redirect flow FIRST
          const redirectResult = await getRedirectResult(auth);
          if (redirectResult && redirectResult.user) {
             console.log("Restored user from redirect:", redirectResult.user.uid);
             return; // User is restored, don't sign in anonymously
          }
        } catch (e) {
          console.log("No redirect result or error:", e);
        }

        // Only if no redirect user found, then sign in anonymously
        try {
          console.log("No active user or redirect found. Signing in anonymously...");
          await signInAnonymously(auth);
        } catch (err) {
          console.error("Anonymous auth failed:", err);
        }
      }
    };
    initAuth();
  }, [user, loading]);

  useEffect(() => {
    if (!user) {
      setRadii([]);
      setGroups([]);
      return;
    }

    setLoading(true);
    
    // Sync Radii
    const radiiQuery = query(collection(db, 'radii'), where('userId', '==', user.uid));
    const unsubscribeRadii = onSnapshot(radiiQuery, (snapshot) => {
      const radiiData: Radius[] = [];
      snapshot.forEach((doc) => {
        radiiData.push(doc.data() as Radius);
      });
      setRadii(radiiData);
    });

    // Sync Groups
    const groupsQuery = query(collection(db, 'groups'), where('userId', '==', user.uid));
    const unsubscribeGroups = onSnapshot(groupsQuery, (snapshot) => {
      const groupsData: Group[] = [];
      snapshot.forEach((doc) => {
        groupsData.push(doc.data() as Group);
      });
      setGroups(groupsData);
      // We can turn off loading once the initial listeners attach, 
      // but in real-time, "loading" is vague. 
      // Simplification: Turn off loading after first radius sync (primary data).
      setLoading(false);
    });

    return () => {
      unsubscribeRadii();
      unsubscribeGroups();
    };
  }, [user, setRadii, setGroups, setLoading]);

  if (loading || !user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        {error && <p className="text-red-500 ml-2">Error: {error.message}</p>}
      </div>
    );
  }

  return <>{children}</>;
};