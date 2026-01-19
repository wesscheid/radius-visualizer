import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
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
          console.log("AuthGuard: No user found. Signing in anonymously...");
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
        <span className="ml-2 text-gray-500 text-sm">Loading session...</span>
      </div>
    );
  }

  if (error) {
     return <div className="p-4 text-red-500">Auth Error: {error.message}</div>;
  }

  return <>{children}</>;
};