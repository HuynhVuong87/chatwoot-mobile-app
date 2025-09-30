import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { Animated, Image, Pressable, StatusBar, TextInput, View, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  BottomSheetModal,
  BottomSheetScrollView,
  useBottomSheetSpringConfigs,
} from '@gorhom/bottom-sheet';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getAuth, getIdToken } from '@react-native-firebase/auth';

import { EMAIL_REGEX } from '@/constants';
import { EyeIcon, EyeSlash } from '@/svg-icons';
import { tailwind } from '@/theme';
import i18n from '@/i18n';
import { resetAuth } from '@/store/auth/authSlice';
import { authActions } from '@/store/auth/authActions';
import { useAppDispatch, useAppSelector } from '@/hooks';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

import {
  BottomSheetBackdrop,
  BottomSheetHeader,
  LanguageList,
  Button,
  Icon,
} from '@/components-next';
import {
  selectInstallationUrl,
  selectBaseUrl,
  selectLocale,
} from '@/store/settings/settingsSelectors';
import { selectIsLoggingIn } from '@/store/auth/authSelectors';
import { setLocale } from '@/store/settings/settingsSlice';
import { useRefsContext } from '@/context/RefsContext';
import { useRequest } from 'ahooks';
import { apiService } from '../../services/APIService';
import { getApp } from '@react-native-firebase/app';

type FormData = {
  email: string;
  password: string;
};

const LoginScreen = () => {
  const navigation = useNavigation();
  const [showPassword, setShowPassword] = useState(false);
  const [isFirebaseLoading, setIsFirebaseLoading] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const { languagesModalSheetRef } = useRefsContext();

  const animationConfigs = useBottomSheetSpringConfigs({
    mass: 1,
    stiffness: 420,
    damping: 30,
  });

  const dispatch = useAppDispatch();
  const isLoggingIn = useAppSelector(selectIsLoggingIn);
  const { signInWithEmailAndPassword, signInWithGoogle, sendPasswordResetEmail } =
    useFirebaseAuth();

  const installationUrl = useAppSelector(selectInstallationUrl);
  const baseUrl = useAppSelector(selectBaseUrl);
  const activeLocale = useAppSelector(selectLocale);

  useEffect(() => {
    languagesModalSheetRef.current?.dismiss({
      overshootClamping: true,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeLocale]);

  useEffect(() => {
    dispatch(resetAuth());
    if (!installationUrl) {
      navigation.navigate('ConfigureURL' as never);
    }
  }, [installationUrl, navigation, dispatch]);

  const { runAsync: handleSSO } = useRequest(
    async (idToken: string) => {
      const res = await apiService
        .get<{
          data: string;
        }>(`https://chat-api.shipxanh.com/chat/auth/sso`, {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
        .catch(err => {
          console.log(err.response);
          throw err;
        });
      const url = res.data.data;
      console.log('url', url);

      const match = url.match(/[?&]sso_auth_token=([^&]+)/);
      if (match) {
        const tokenSSO = match[1];
        return tokenSSO;
      } else throw 'Token not found';
    },
    {
      manual: true,
    },
  );

  const handleFirebaseAuthSuccess = async (firebaseUser: {
    email: string | null;
    uid: string;
    displayName: string | null;
    emailVerified: boolean;
  }) => {
    try {
      // Get Firebase ID token from current user
      const currentUser = getAuth(getApp()).currentUser;
      if (!currentUser) {
        throw new Error('No current user found');
      }

      const idToken = await getIdToken(currentUser, true);
      console.log('idToken', idToken);

      return await handleSSO(idToken);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      console.error('Error getting Firebase token:', error);
      Alert.alert('Error', 'Failed to get Firebase token');
      return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    const { email, password } = data;
    setIsFirebaseLoading(true);

    try {
      // Try Firebase Auth first
      const firebaseResult = await signInWithEmailAndPassword(email, password);

      if (firebaseResult.user) {
        // Handle Firebase auth success and get SSO token
        const tokenSSO = await handleFirebaseAuthSuccess(firebaseResult.user);

        if (!tokenSSO) {
          return; // Exit if token retrieval failed
        }

        // Firebase auth successful, now try to authenticate with your backend
        // Clear any existing auth state before login
        dispatch(resetAuth());

        try {
          // Use tokenSSO as password for backend authentication
          const result = await dispatch(
            authActions.login({ email, sso_auth_token: tokenSSO }),
          ).unwrap();

          console.log('🔍 Debug - Login result:', result);

          // Check if MFA is required in the response
          if ('mfa_required' in result && result.mfa_required) {
            // Navigate directly to MFA screen with the token
            navigation.navigate('MFAScreen' as never);
          }
          // If MFA not required, the auth state will be updated and
          // the app will automatically navigate to the dashboard
        } catch (backendError) {
          // Backend login failed with SSO token
          console.warn('Backend login failed with SSO token:', backendError);
          Alert.alert(
            'Authentication Error',
            'Firebase authentication succeeded, but backend authentication with SSO token failed. Please contact support.',
          );
        }
      }
    } catch (error) {
      // Firebase auth failed
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to authenticate with Firebase';
      Alert.alert('Login Failed', errorMessage);
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setIsFirebaseLoading(true);
    try {
      const result = await signInWithGoogle();
      if (result.user) {
        // Handle Firebase auth success and get SSO token
        const tokenSSO = await handleFirebaseAuthSuccess(result.user);

        if (!tokenSSO) {
          return; // Exit if token retrieval failed
        }

        // Firebase auth successful, now try to authenticate with your backend
        // Clear any existing auth state before login
        dispatch(resetAuth());

        try {
          // Use tokenSSO for backend authentication with Google user email
          const email = result.user.email || '';
          const loginResult = await dispatch(
            authActions.login({ email, sso_auth_token: tokenSSO }),
          ).unwrap();

          console.log('🔍 Debug - Google Login result:', loginResult);

          // Check if MFA is required in the response
          if ('mfa_required' in loginResult && loginResult.mfa_required) {
            // Navigate directly to MFA screen with the token
            navigation.navigate('MFAScreen' as never);
          }
          // If MFA not required, the auth state will be updated and
          // the app will automatically navigate to the dashboard
        } catch (backendError) {
          // Backend login failed with SSO token
          console.warn('Backend login failed with SSO token (Google):', backendError);
          Alert.alert(
            'Authentication Error',
            'Google authentication succeeded, but backend authentication with SSO token failed. Please contact support.',
          );
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to sign in with Google';
      Alert.alert('Google Sign-In Failed', errorMessage);
    } finally {
      setIsFirebaseLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    // Get email from form or show input dialog
    Alert.prompt(
      'Reset Password',
      'Enter your email address to receive password reset instructions:',
      async email => {
        if (email && EMAIL_REGEX.test(email)) {
          try {
            await sendPasswordResetEmail(email);
            Alert.alert('Success', 'Password reset email sent! Check your inbox.');
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : 'Failed to send password reset email';
            Alert.alert('Error', errorMessage);
          }
        } else {
          Alert.alert('Invalid Email', 'Please enter a valid email address');
        }
      },
      'plain-text',
    );
  };

  const onChangeLanguage = (locale: string) => {
    dispatch(setLocale(locale));
  };

  return (
    <SafeAreaView edges={['top']} style={tailwind.style('flex-1 bg-white')}>
      <StatusBar
        translucent
        backgroundColor={tailwind.color('bg-white')}
        barStyle={'dark-content'}
      />
      <View style={tailwind.style('flex-1 bg-white')}>
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={tailwind.style('px-6 pt-24')}>
          <Image
            // eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-require-imports
            source={require('@/assets/images/logo.png')}
            style={tailwind.style('w-20 h-20')}
            resizeMode="contain"
          />
          <View style={tailwind.style('pt-6 gap-4')}>
            <Animated.Text style={tailwind.style('text-2xl text-gray-950 font-inter-semibold-20')}>
              {i18n.t('LOGIN.TITLE')}
            </Animated.Text>
            <Animated.Text
              style={tailwind.style(
                'font-inter-normal-20 leading-[18px] tracking-[0.32px] text-gray-900',
              )}>
              {i18n.t('LOGIN.DESCRIPTION', { baseUrl })}
            </Animated.Text>
          </View>

          <Controller
            control={control}
            rules={{
              required: i18n.t('LOGIN.EMAIL_REQUIRED'),
              pattern: {
                value: EMAIL_REGEX,
                message: i18n.t('LOGIN.EMAIL_ERROR'),
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={tailwind.style('pt-8 gap-2')}>
                <Animated.Text style={tailwind.style('font-inter-420-20 text-gray-950')}>
                  {i18n.t('LOGIN.EMAIL')}
                </Animated.Text>
                <TextInput
                  style={[
                    tailwind.style(
                      'text-base font-inter-normal-20 tracking-[0.24px] leading-[20px] android:leading-[18px]',
                      'py-2 px-3 rounded-xl text-gray-950 bg-blackA-A4',
                      'h-10',
                    ),
                  ]}
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  placeholderTextColor={tailwind.color('text-gray-900')}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {errors.email && (
                  <Animated.Text style={tailwind.style('font-inter-normal-20 text-ruby-900')}>
                    {errors.email.message}
                  </Animated.Text>
                )}
              </View>
            )}
            name="email"
          />

          <Controller
            control={control}
            rules={{
              required: i18n.t('LOGIN.PASSWORD_REQUIRED'),
              minLength: {
                value: 6,
                message: i18n.t('LOGIN.PASSWORD_ERROR'),
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <View style={tailwind.style('pt-8 gap-2')}>
                <Animated.Text style={tailwind.style('font-inter-420-20  text-gray-950')}>
                  {i18n.t('LOGIN.PASSWORD')}
                </Animated.Text>
                <View style={tailwind.style('relative')}>
                  <TextInput
                    style={[
                      tailwind.style(
                        'text-base font-inter-normal-20 tracking-[0.24px] leading-[20px] android:leading-[18px]',
                        'py-2 pl-3 pr-10 rounded-xl text-gray-950 bg-blackA-A4',
                        'h-10',
                      ),
                    ]}
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    placeholderTextColor={tailwind.color('text-gray-500')}
                    secureTextEntry={!showPassword}
                  />
                  <Pressable
                    style={tailwind.style('absolute right-4 top-2.5')}
                    onPress={() => setShowPassword(!showPassword)}>
                    <Icon size={20} icon={showPassword ? <EyeIcon /> : <EyeSlash />} />
                  </Pressable>
                </View>
                {errors.password && (
                  <Animated.Text style={tailwind.style('text-ruby-900')}>
                    {errors.password.message}
                  </Animated.Text>
                )}
              </View>
            )}
            name="password"
          />

          <Pressable style={tailwind.style('pt-1 mb-4')} onPress={handleForgotPassword}>
            <Animated.Text style={tailwind.style('text-blue-800 font-inter-medium-24 text-right')}>
              {i18n.t('LOGIN.FORGOT_PASSWORD')}
            </Animated.Text>
          </Pressable>

          <Button
            text={
              isLoggingIn || isFirebaseLoading
                ? i18n.t('LOGIN.LOGIN_LOADING')
                : i18n.t('LOGIN.LOGIN')
            }
            handlePress={handleSubmit(onSubmit)}
          />

          <View style={tailwind.style('mt-4 gap-3')}>
            <View style={tailwind.style('flex-row items-center gap-4')}>
              <View style={tailwind.style('flex-1 h-px bg-gray-300')} />
              <Animated.Text style={tailwind.style('text-gray-500 text-sm')}>OR</Animated.Text>
              <View style={tailwind.style('flex-1 h-px bg-gray-300')} />
            </View>

            <Button
              text={isFirebaseLoading ? 'Google...' : 'Google+'}
              handlePress={handleGoogleSignIn}
              variant="red"
            />
          </View>

          <Pressable
            style={tailwind.style('flex-row justify-center items-center mt-4')}
            onPress={() => languagesModalSheetRef.current?.present()}>
            <Animated.Text style={tailwind.style('text-sm text-gray-900')}>
              {i18n.t('LOGIN.CHANGE_LANGUAGE')}
            </Animated.Text>
          </Pressable>
        </Animated.ScrollView>
      </View>
      <BottomSheetModal
        ref={languagesModalSheetRef}
        backdropComponent={BottomSheetBackdrop}
        handleIndicatorStyle={tailwind.style('overflow-hidden bg-blackA-A6 w-8 h-1 rounded-[11px]')}
        detached
        enablePanDownToClose
        animationConfigs={animationConfigs}
        handleStyle={tailwind.style('p-0 h-4 pt-[5px]')}
        style={tailwind.style('rounded-[26px] overflow-hidden')}
        snapPoints={['70%']}>
        <BottomSheetScrollView showsVerticalScrollIndicator={false}>
          <BottomSheetHeader headerText={i18n.t('SETTINGS.SET_LANGUAGE')} />
          <LanguageList onChangeLanguage={onChangeLanguage} currentLanguage={activeLocale} />
        </BottomSheetScrollView>
      </BottomSheetModal>
    </SafeAreaView>
  );
};

export default LoginScreen;
