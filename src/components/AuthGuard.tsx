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
  const [checkingRedirect, setCheckingRedirect] = React.useState(true);

  useEffect(() => {
    const initAuth = async () => {
      // If firebase-hooks is still loading, do nothing yet
      if (loading) return;

      // If we have a non-anonymous user, we are definitely logged in.
      if (user && !user.isAnonymous) {
        setCheckingRedirect(false);
        return;
      }

      console.log("AuthGuard: Checking for redirect result (User is " + (user ? "Guest" : "Null") + ")...");
      
      try {
        const redirectResult = await getRedirectResult(auth);
        if (redirectResult && redirectResult.user) {
           console.log("AuthGuard: Restored user from redirect:", redirectResult.user.uid);
           setCheckingRedirect(false);
           return; 
        }
      } catch (e: any) {
        console.error("AuthGuard: Redirect check error:", e);
      }

      // If we have a guest already, we're done (redirect result was null)
      if (user && user.isAnonymous) {
        setCheckingRedirect(false);
        return;
      }

      // No user at all, and no redirect result found.
      try {
        console.log("AuthGuard: creating new anonymous session...");
        await signInAnonymously(auth);
      } catch (err) {
        console.error("AuthGuard: Anonymous auth failed:", err);
      } finally {
        setCheckingRedirect(false);
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

  if (loading || checkingRedirect) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-2 text-gray-500 text-sm">Authenticating...</span>
      </div>
    );
  }

  if (error) {
     return <p className="text-red-500">Auth Error: {error.message}</p>;
  }

  // If we have no user and aren't loading/checking, something is wrong, but render children anyway 
  // (Sidebar will handle "Guest" display if user somehow appears late or is null)
  return <>{children}</>;
};