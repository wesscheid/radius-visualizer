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

      // If we already have a user, we are good. Stop checking redirect.
      if (user) {
        setCheckingRedirect(false);
        return;
      }

      console.log("AuthGuard: No user found. Checking for redirect result...");
      
      try {
        // Check if we are returning from a redirect flow (Google Login)
        const redirectResult = await getRedirectResult(auth);
        
        if (redirectResult && redirectResult.user) {
           console.log("AuthGuard: Restored user from redirect:", redirectResult.user.uid);
           // User restored! useAuthState will update automatically in the next render cycle.
           // We set checkingRedirect to false, but we might want to keep it true until 'user' is populated?
           // Actually, if we return here, the 'user' dependency will trigger this effect again,
           // and the 'if (user)' block above will handle it.
           return; 
        } else {
           console.log("AuthGuard: No redirect result found.");
        }
      } catch (e: any) {
        console.error("AuthGuard: Redirect check error:", e);
        if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') {
           // If it's a real error, we might want to show it? 
           // For now, log it and proceed to anonymous auth.
        }
      }

      // If we reached here: No User AND No Redirect Result.
      // Now it is safe to sign in anonymously.
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