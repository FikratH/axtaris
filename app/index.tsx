import React, { useEffect, useRef } from 'react';
import { View, Text, Image, StyleSheet, Animated, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '@/store/authStore';
import { useAppStore } from '@/store/appStore';

const { width } = Dimensions.get('window');

const LOGO_ICON = require('@/assets/axtaris_logo_icon_png.png');
const LOGO_TEXT = require('@/assets/axtaris_text_logo_png.png');

export default function SplashScreen() {
  const { colors, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const isLoading = useAuthStore((s) => s.isLoading);
  const authStatus = useAuthStore((s) => s.authStatus);
  const pendingVerification = useAuthStore((s) => s.pendingVerification);
  const hasOnboarded = useAppStore((s) => s.hasCompletedOnboarding);

  const logoScale = useRef(new Animated.Value(0.8)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const loadingWidth = useRef(new Animated.Value(0)).current;

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

    Animated.timing(loadingWidth, {
      toValue: 1,
      duration: 1800,
      useNativeDriver: false,
    }).start();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const timer = setTimeout(() => {
      if (hasOnboarded === false) {
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
    hasOnboarded,
    isAuthenticated,
    isLoading,
    pendingVerification?.email,
    router,
    user,
  ]);

  const animatedLoadingWidth = loadingWidth.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.container, { backgroundColor: '#0A1628' }]}>
      <Animated.View
        style={[
          styles.logoContainer,
          { transform: [{ scale: logoScale }], opacity: logoOpacity },
        ]}
      >
        <Image source={LOGO_ICON} style={styles.logoImage} resizeMode="contain" />
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Image source={LOGO_TEXT} style={styles.logoTextImage} resizeMode="contain" />
        <Text style={[styles.tagline, { color: 'rgba(255,255,255,0.5)' }]}>
          {tr('common.tagline')}
        </Text>
      </Animated.View>

      <View style={styles.bottomIndicator}>
        <View style={[styles.loadingBar, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
          <Animated.View
            style={[
              styles.loadingBarFill,
              { backgroundColor: '#5B7FD6', width: animatedLoadingWidth },
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
    width: 140,
    height: 140,
  },
  logoImage: {
    width: 120,
    height: 120,
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  logoTextImage: {
    width: 240,
    height: 120,
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
    borderRadius: 2,
  },
});
