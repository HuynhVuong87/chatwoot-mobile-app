# Firebase Authentication Setup Guide

This guide will help you set up Firebase Authentication with Google Sign-In for the Shipxanh Mobile Chat app.

## Prerequisites

1. Firebase project with Authentication enabled
2. Google Cloud Console project (for Google Sign-In)
3. Firebase configuration files (google-services.json for Android, GoogleService-Info.plist for iOS)

## Setup Steps

### 1. Firebase Console Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project or create a new one
3. Navigate to **Authentication** > **Sign-in method**
4. Enable **Email/Password** authentication
5. Enable **Google** authentication
6. Add your app's package name and SHA-1 certificate fingerprint

### 2. Google Cloud Console Configuration

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Select your project
3. Navigate to **APIs & Services** > **Credentials**
4. Create OAuth 2.0 Client IDs:
   - **Web client** (for Firebase)
   - **iOS client** (for your iOS app)
   - **Android client** (for your Android app)

### 3. Environment Variables

Add the following variables to your `.env` file:

```env
# Firebase Configuration
EXPO_PUBLIC_IOS_GOOGLE_SERVICES_FILE=./GoogleService-Info.plist
EXPO_PUBLIC_ANDROID_GOOGLE_SERVICES_FILE=./google-services.json

# Google Sign-In Configuration
EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID=your-web-client-id.googleusercontent.com
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=your-ios-client-id.googleusercontent.com
EXPO_PUBLIC_IOS_URL_SCHEME=com.googleusercontent.apps.your-ios-client-id
```

### 4. Firebase Configuration Files

1. Download `google-services.json` from Firebase Console (Android app settings)
2. Download `GoogleService-Info.plist` from Firebase Console (iOS app settings)
3. Place both files in the root directory of your project

### 5. Build Configuration

After setting up the environment variables and configuration files, you need to regenerate the native code:

```bash
# Clean and regenerate native code
npx expo prebuild --clean

# For iOS development
npx expo run:ios

# For Android development
npx expo run:android
```

## Usage

The Firebase Authentication is now integrated into the LoginScreen with the following features:

### Email/Password Authentication
- Users can sign in with email and password
- Firebase Auth validates credentials
- On success, attempts to authenticate with your backend API
- Maintains compatibility with existing Chatwoot authentication

### Google Sign-In
- Users can sign in with their Google account
- Automatic account creation for new users
- Seamless integration with Firebase Auth

### Password Reset
- Users can request password reset emails
- Handled entirely through Firebase Auth

## Code Structure

```
src/
├── services/
│   └── FirebaseAuthService.ts     # Firebase Auth service singleton
├── hooks/
│   └── useFirebaseAuth.ts         # React hook for Firebase Auth
└── screens/auth/
    └── LoginScreen.tsx            # Updated login screen with Firebase Auth
```

## Error Handling

The implementation includes comprehensive error handling:
- Firebase-specific error codes are mapped to user-friendly messages
- Network errors are handled gracefully
- Backend authentication failures are logged and reported

## Security Considerations

1. **Environment Variables**: Never commit actual credentials to version control
2. **API Keys**: Use environment-specific configuration files
3. **Certificate Fingerprints**: Ensure SHA-1 fingerprints match your app signing certificates
4. **Domain Verification**: Configure authorized domains in Firebase Console

## Troubleshooting

### Common Issues

1. **Google Sign-In not working**:
   - Verify SHA-1 fingerprints in Firebase Console
   - Check that Google Sign-In is enabled in Firebase Auth
   - Ensure correct client IDs in environment variables

2. **Firebase initialization errors**:
   - Verify configuration files are in the correct location
   - Check that file paths in environment variables are correct
   - Ensure Firebase project is properly configured

3. **Build errors**:
   - Run `npx expo prebuild --clean` to regenerate native code
   - Clear Metro cache: `npx expo start --clear`
   - Check that all required packages are installed

### Debug Mode

For debugging Firebase Auth issues, you can enable debug logging by adding this to your app:

```typescript
import { GoogleSignin } from '@react-native-google-signin/google-signin';

// Enable debug mode (development only)
if (__DEV__) {
  GoogleSignin.configure({
    // ... other config
    debug: true,
  });
}
```

## Next Steps

1. Test authentication flows in development
2. Configure production Firebase project
3. Set up proper error monitoring (Sentry integration is already configured)
4. Implement user profile management
5. Add social login providers as needed

## Support

For issues related to:
- Firebase: [Firebase Support](https://firebase.google.com/support)
- Google Sign-In: [Google Sign-In Documentation](https://developers.google.com/identity/sign-in/android)
- Expo: [Expo Documentation](https://docs.expo.dev/)
