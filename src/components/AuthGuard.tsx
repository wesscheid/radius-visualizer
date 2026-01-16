import React, { useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useStore, Radius } from '../store/useStore';
import { LogIn, LogOut, Loader2, Map as MapIcon } from 'lucide-react';

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const { setRadii, setLoading } = useStore();

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

  const login = () => signInWithPopup(auth, new GoogleAuthProvider());
  const logout = () => signOut(auth);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center bg-slate-900 text-white p-4 text-center">
        <div className="mb-8 flex flex-col items-center">
           <div className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-xl shadow-blue-900/20">
              <MapIcon size={40} />
           </div>
           <h1 className="text-3xl font-bold tracking-tight">Radius Visualizer</h1>
           <p className="text-slate-400 mt-2 max-w-xs">
             Create, save, and manage custom map radii privately.
           </p>
        </div>
        
        <button
          onClick={login}
          className="flex items-center gap-3 bg-white text-slate-900 px-8 py-3 rounded-full font-semibold hover:bg-slate-100 transition-all active:scale-95 shadow-lg"
        >
          <LogIn size={20} />
          Sign in with Google
        </button>
        
        <p className="mt-6 text-xs text-slate-500">
          Your data is securely stored in your personal cloud.
        </p>
      </div>
    );
  }

  return (
    <>
      {children}
      <button
        onClick={logout}
        className="absolute top-4 right-4 z-[9999] p-2 bg-white rounded-full shadow-md hover:bg-red-50 hover:text-red-600 transition-colors group"
        title="Sign Out"
      >
        <LogOut size={20} />
      </button>
    </>
  );
};