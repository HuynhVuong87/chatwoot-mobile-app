import {
  FirebaseAuthTypes,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithCredential,
  sendPasswordResetEmail,
  signOut,
  GoogleAuthProvider,
  getAuth,
} from '@react-native-firebase/auth';
import { getApp } from '@react-native-firebase/app';
import { GoogleSignin } from '@react-native-google-signin/google-signin';

export interface FirebaseAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  phoneNumber: string | null;
}

export interface FirebaseLoginResult {
  user: FirebaseAuthUser;
  isNewUser: boolean;
}

class FirebaseAuthService {
  private static instance: FirebaseAuthService;

  public static getInstance(): FirebaseAuthService {
    if (!FirebaseAuthService.instance) {
      FirebaseAuthService.instance = new FirebaseAuthService();
    }
    return FirebaseAuthService.instance;
  }

  /**
   * Sign in with email and password
   */
  async signInWithEmailAndPassword(email: string, password: string): Promise<FirebaseLoginResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(getAuth(getApp()), email, password);
      return this.mapUserCredentialToResult(userCredential);
    } catch (error) {
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Create account with email and password
   */
  async createUserWithEmailAndPassword(
    email: string,
    password: string,
  ): Promise<FirebaseLoginResult> {
    try {
      const userCredential = await createUserWithEmailAndPassword(
        getAuth(getApp()),
        email,
        password,
      );
      return this.mapUserCredentialToResult(userCredential);
    } catch (error) {
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Sign in with Google
   */
  async signInWithGoogle(): Promise<FirebaseLoginResult> {
    try {
      // Check if your device supports Google Play
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      // Get the users ID token
      const signInResult = await GoogleSignin.signIn();
      const idToken = signInResult.data?.idToken;

      if (!idToken) {
        throw new Error('Failed to get Google ID token');
      }

      // Create a Google credential with the token
      const googleCredential = GoogleAuthProvider.credential(idToken);

      // Sign-in the user with the credential
      const userCredential = await signInWithCredential(getAuth(getApp()), googleCredential);
      return this.mapUserCredentialToResult(userCredential);
    } catch (error) {
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordResetEmail(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(getAuth(getApp()), email);
    } catch (error) {
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut(): Promise<void> {
    try {
      await signOut(getAuth(getApp()));
      // Also sign out from Google if signed in
      await GoogleSignin.signOut();
    } catch (error) {
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Get current user
   */
  getCurrentUser(): FirebaseAuthUser | null {
    const user = getAuth(getApp()).currentUser;
    return user ? this.mapFirebaseUserToAuthUser(user) : null;
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChanged(callback: (user: FirebaseAuthUser | null) => void): () => void {
    return onAuthStateChanged(getAuth(getApp()), user => {
      callback(user ? this.mapFirebaseUserToAuthUser(user) : null);
    });
  }

  /**
   * Update user profile
   */
  async updateProfile(profile: { displayName?: string; photoURL?: string }): Promise<void> {
    const user = getAuth(getApp()).currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      await user.updateProfile(profile);
    } catch (error) {
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Send email verification
   */
  async sendEmailVerification(): Promise<void> {
    const user = getAuth(getApp()).currentUser;
    if (!user) {
      throw new Error('No authenticated user');
    }

    try {
      await user.sendEmailVerification();
    } catch (error) {
      throw this.mapFirebaseError(error);
    }
  }

  /**
   * Map Firebase UserCredential to our result format
   */
  private mapUserCredentialToResult(
    userCredential: FirebaseAuthTypes.UserCredential,
  ): FirebaseLoginResult {
    return {
      user: this.mapFirebaseUserToAuthUser(userCredential.user),
      isNewUser: userCredential.additionalUserInfo?.isNewUser || false,
    };
  }

  /**
   * Map Firebase User to our auth user format
   */
  private mapFirebaseUserToAuthUser(user: FirebaseAuthTypes.User): FirebaseAuthUser {
    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      phoneNumber: user.phoneNumber,
    };
  }

  /**
   * Map Firebase errors to user-friendly messages
   */
  private mapFirebaseError(error: unknown): Error {
    let message = 'An error occurred during authentication';

    if (error && typeof error === 'object' && 'code' in error) {
      switch ((error as { code: string }).code) {
        case 'auth/user-not-found':
          message = 'No user found with this email address';
          break;
        case 'auth/wrong-password':
          message = 'Incorrect password';
          break;
        case 'auth/email-already-in-use':
          message = 'Email address is already in use';
          break;
        case 'auth/weak-password':
          message = 'Password is too weak';
          break;
        case 'auth/invalid-email':
          message = 'Invalid email address';
          break;
        case 'auth/user-disabled':
          message = 'User account has been disabled';
          break;
        case 'auth/too-many-requests':
          message = 'Too many failed attempts. Please try again later';
          break;
        case 'auth/network-request-failed':
          message = 'Network error. Please check your connection';
          break;
        default:
          message = (error as { message?: string }).message || message;
      }
    }

    return new Error(message);
  }
}

export default FirebaseAuthService.getInstance();
