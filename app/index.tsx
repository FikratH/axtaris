import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const { colors, typography: t } = useTheme();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authStatus = useAuthStore((s) => s.authStatus);
  const pendingVerification = useAuthStore((s) => s.pendingVerification);

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(async () => {
      const onboarded = await AsyncStorage.getItem('@axtaris_onboarded');

      if (!onboarded) {
        router.replace('/onboarding');
      } else if (
        authStatus === 'pending_verification' &&
        pendingVerification?.email
      ) {
        router.replace({
          pathname: '/auth/verify-otp',
          params: { email: pendingVerification.email },
        });
      } else if (isAuthenticated && user) {
        if (user.role === 'employer') {
          router.replace('/(employer)/dashboard');
        } else {
          router.replace('/(candidate)/home');
        }
      } else {
        router.replace('/auth/role-select');
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [
    authStatus,
    isAuthenticated,
    isLoading,
    pendingVerification?.email,
    router,
    user,
  ]);

  return (
    <View style={[styles.container, { backgroundColor: '#0A1628' }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <View style={styles.logoIcon}>
          <View style={[styles.magnifier, { borderColor: '#FFFFFF' }]}>
            <View style={[styles.magnifierHandle, { backgroundColor: '#FFFFFF' }]} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={[styles.appName, { color: '#FFFFFF' }]}>
          Axtar<Text style={{ color: '#5B7FD6' }}>IS</Text>
        </Text>
        <Text style={[styles.tagline, { color: 'rgba(255,255,255,0.5)' }]}>
          Premium Employment Platform
        </Text>
      </Animated.View>

      <View style={styles.bottomIndicator}>
        <View style={[styles.loadingBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Animated.View
            style={[
              styles.loadingBarFill,
              { backgroundColor: '#5B7FD6' },
            ]}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 100,
    height: 100,
  },
  logoIcon: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  magnifier: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
  },
  magnifierHandle: {
    position: 'absolute',
    bottom: -12,
    right: -8,
    width: 4,
    height: 20,
    borderRadius: 2,
    transform: [{ rotate: '45deg' }],
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 24,
  },
  appName: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  bottomIndicator: {
    position: 'absolute',
    bottom: 80,
    width: width * 0.3,
  },
  loadingBar: {
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  loadingBarFill: {
    height: '100%',
    width: '60%',
    borderRadius: 2,
  },
});
