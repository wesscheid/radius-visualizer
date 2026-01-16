import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { signInAnonymously } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useStore, Radius } from '../store/useStore';
import { Loader2 } from 'lucide-react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const { setRadii, setLoading } = useStore();

  useEffect(() => {
    const initAuth = async () => {
      if (!loading && !user) {
        try {
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
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'radii'), where('userId', '==', user.uid));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const radiiData: Radius[] = [];
      snapshot.forEach((doc) => {
        radiiData.push(doc.data() as Radius);
      });
      setRadii(radiiData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, setRadii, setLoading]);

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