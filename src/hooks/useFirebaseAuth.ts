import { useState, useEffect } from 'react';
import FirebaseAuthService, {
  FirebaseAuthUser,
  FirebaseLoginResult,
} from '@/services/FirebaseAuthService';

export interface UseFirebaseAuthReturn {
  user: FirebaseAuthUser | null;
  loading: boolean;
  signInWithEmailAndPassword: (email: string, password: string) => Promise<FirebaseLoginResult>;
  createUserWithEmailAndPassword: (email: string, password: string) => Promise<FirebaseLoginResult>;
  signInWithGoogle: () => Promise<FirebaseLoginResult>;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  updateProfile: (profile: { displayName?: string; photoURL?: string }) => Promise<void>;
}

export const useFirebaseAuth = (): UseFirebaseAuthReturn => {
  const [user, setUser] = useState<FirebaseAuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set initial user
    const currentUser = FirebaseAuthService.getCurrentUser();
    setUser(currentUser);
    setLoading(false);

    // Listen to auth state changes
    const unsubscribe = FirebaseAuthService.onAuthStateChanged(authUser => {
      setUser(authUser);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithEmailAndPassword = async (
    email: string,
    password: string,
  ): Promise<FirebaseLoginResult> => {
    setLoading(true);
    try {
      const result = await FirebaseAuthService.signInWithEmailAndPassword(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const createUserWithEmailAndPassword = async (
    email: string,
    password: string,
  ): Promise<FirebaseLoginResult> => {
    setLoading(true);
    try {
      const result = await FirebaseAuthService.createUserWithEmailAndPassword(email, password);
      return result;
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async (): Promise<FirebaseLoginResult> => {
    setLoading(true);
    try {
      const result = await FirebaseAuthService.signInWithGoogle();
      return result;
    } finally {
      setLoading(false);
    }
  };

  const sendPasswordResetEmail = async (email: string): Promise<void> => {
    await FirebaseAuthService.sendPasswordResetEmail(email);
  };

  const signOut = async (): Promise<void> => {
    setLoading(true);
    try {
      await FirebaseAuthService.signOut();
    } finally {
      setLoading(false);
    }
  };

  const sendEmailVerification = async (): Promise<void> => {
    await FirebaseAuthService.sendEmailVerification();
  };

  const updateProfile = async (profile: {
    displayName?: string;
    photoURL?: string;
  }): Promise<void> => {
    await FirebaseAuthService.updateProfile(profile);
  };

  return {
    user,
    loading,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signInWithGoogle,
    sendPasswordResetEmail,
    signOut,
    sendEmailVerification,
    updateProfile,
  };
};
