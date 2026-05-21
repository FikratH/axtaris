import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { changeLanguage, languages, LanguageCode } from '@/i18n';
import { Button } from '@/components/ui/Button';
import {
  Target,
  Cpu,
  Briefcase,
  Globe,
  Sun,
  Moon,
  Monitor,
  Check,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react-native';

const LOGO_ICON = require('@/assets/axtaris_logo_icon_png.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 5;
const SLIDE_DURATION = 320;

// ── Animated wrapper — supports forward/backward direction ───
function AnimatedSlide({
  stepKey,
  direction,
  children,
}: {
  stepKey: number;
  direction: 'forward' | 'backward';
  children: React.ReactNode;
}) {
  const translateX = useSharedValue(direction === 'forward' ? SCREEN_WIDTH * 0.2 : -SCREEN_WIDTH * 0.2);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.97);

  useEffect(() => {
    translateX.value = direction === 'forward' ? SCREEN_WIDTH * 0.2 : -SCREEN_WIDTH * 0.2;
    opacity.value = 0;
    scale.value = 0.97;
    translateX.value = withTiming(0, { duration: SLIDE_DURATION, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(1, { duration: SLIDE_DURATION * 0.8 });
    scale.value = withTiming(1, { duration: SLIDE_DURATION, easing: Easing.out(Easing.cubic) });
  }, [stepKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  return <Animated.View style={[styles.slideAnimated, animatedStyle]}>{children}</Animated.View>;
}

// ── Animated dot indicator ───────────────────────────────────
function AnimatedDot({ active, color }: { active: boolean; color: string }) {
  const dotWidth = useSharedValue(active ? 24 : 8);
  const dotOpacity = useSharedValue(active ? 1 : 0.3);

  useEffect(() => {
    dotWidth.value = withSpring(active ? 24 : 8, { damping: 15, stiffness: 200 });
    dotOpacity.value = withTiming(active ? 1 : 0.3, { duration: 250 });
  }, [active]);

  const style = useAnimatedStyle(() => ({
    width: dotWidth.value,
    opacity: dotOpacity.value,
  }));

  return <Animated.View style={[styles.dot, { backgroundColor: color }, style]} />;
}

// ── Animated icon with spring entrance ───────────────────────
function AnimatedIconBox({
  children,
  bgColor,
  stepKey,
}: {
  children: React.ReactNode;
  bgColor: string;
  stepKey: number;
}) {
  const iconScale = useSharedValue(0.5);
  const iconOpacity = useSharedValue(0);

  useEffect(() => {
    iconScale.value = 0.5;
    iconOpacity.value = 0;
    iconScale.value = withDelay(80, withSpring(1, { damping: 12, stiffness: 180 }));
    iconOpacity.value = withDelay(80, withTiming(1, { duration: 280 }));
  }, [stepKey]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
    opacity: iconOpacity.value,
  }));

  return (
    <Animated.View style={[styles.iconContainer, { backgroundColor: bgColor }, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

// ── Theme switch flash overlay ───────────────────────────────
function ThemeFlash({ trigger }: { trigger: number }) {
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    flashOpacity.value = 0.35;
    flashOpacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });
  }, [trigger]);

  const style = useAnimatedStyle(() => ({
    opacity: flashOpacity.value,
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: '#FFFFFF' }, style]}
    />
  );
}

// ═══════════════════════════════════════════════════════════════
export default function OnboardingScreen() {
  const { colors, spacing: s, typography: t, radius: r, isDark, mode, setMode } = useTheme();
  const { t: tr, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward');
  const [isAnimating, setIsAnimating] = useState(false);
  const [themeFlashCount, setThemeFlashCount] = useState(0);
  const appCompleteOnboarding = useAppStore((st) => st.completeOnboarding);

  const exitX = useSharedValue(0);
  const exitOpacity = useSharedValue(1);

  const animateTransition = useCallback(
    (nextStep: number, dir: 'forward' | 'backward') => {
      if (isAnimating) return;
      setIsAnimating(true);
      const exitDir = dir === 'forward' ? -1 : 1;
      exitX.value = withTiming(SCREEN_WIDTH * 0.12 * exitDir, {
        duration: SLIDE_DURATION * 0.5,
        easing: Easing.in(Easing.cubic),
      });
      exitOpacity.value = withTiming(0, { duration: SLIDE_DURATION * 0.5 });

      setTimeout(() => {
        setDirection(dir);
        setStep(nextStep);
        exitX.value = 0;
        exitOpacity.value = 1;
        setTimeout(() => setIsAnimating(false), SLIDE_DURATION);
      }, SLIDE_DURATION * 0.4);
    },
    [isAnimating]
  );

  const handleNext = useCallback(() => {
    if (isAnimating) return;
    if (step < TOTAL_STEPS - 1) {
      animateTransition(step + 1, 'forward');
    } else {
      finishOnboarding();
    }
  }, [step, isAnimating, animateTransition]);

  const handleBack = useCallback(() => {
    if (isAnimating || step === 0) return;
    animateTransition(step - 1, 'backward');
  }, [step, isAnimating, animateTransition]);

  const handleSkip = useCallback(() => {
    finishOnboarding();
  }, []);

  const finishOnboarding = async () => {
    await appCompleteOnboarding();
    router.replace('/auth/role-select');
  };

  const handleLanguageSelect = async (code: LanguageCode) => {
    await changeLanguage(code);
  };

  const handleThemeSelect = (key: 'light' | 'dark' | 'system') => {
    setMode(key);
    setThemeFlashCount((c) => c + 1);
  };

  const exitStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: exitX.value }],
    opacity: exitOpacity.value,
  }));

  const isLastStep = step === TOTAL_STEPS - 1;
  const isFirstStep = step === 0;

  // ── Feature slide ──────────────────────────────────────────
  const renderFeatureSlide = (
    Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>,
    titleKey: string,
    descKey: string
  ) => (
    <View style={styles.slideContent}>
      <AnimatedIconBox bgColor={colors.primaryLight} stepKey={step}>
        <Icon size={48} color={colors.primary} strokeWidth={1.5} />
      </AnimatedIconBox>
      <Text style={[styles.slideTitle, { color: colors.textPrimary, ...t.displayMedium }]}>
        {tr(titleKey)}
      </Text>
      <Text style={[styles.slideDesc, { color: colors.textSecondary, ...t.bodyLarge }]}>
        {tr(descKey)}
      </Text>
    </View>
  );

  // ── Language slide ─────────────────────────────────────────
  const renderLanguageSlide = () => {
    const currentLang = i18n.language as LanguageCode;
    const langEntries = Object.entries(languages) as [LanguageCode, (typeof languages)[LanguageCode]][];

    return (
      <View style={styles.slideContent}>
        <AnimatedIconBox bgColor={colors.primaryLight} stepKey={step}>
          <Globe size={48} color={colors.primary} strokeWidth={1.5} />
        </AnimatedIconBox>
        <Text style={[styles.slideTitle, { color: colors.textPrimary, ...t.displayMedium }]}>
          {tr('onboarding.chooseLanguage')}
        </Text>
        <Text style={[styles.slideDesc, { color: colors.textSecondary, ...t.bodyMedium }]}>
          {tr('onboarding.chooseLanguageDesc')}
        </Text>
        <View style={styles.optionsContainer}>
          {langEntries.map(([code, lang]) => {
            const isActive = currentLang === code;
            return (
              <TouchableOpacity
                key={code}
                activeOpacity={0.7}
                onPress={() => handleLanguageSelect(code)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isActive ? colors.primaryLight : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                    borderRadius: r.lg,
                  },
                ]}
              >
                <Text style={[styles.optionLabel, { color: colors.textPrimary, ...t.headingSmall }]}>
                  {lang.nativeLabel}
                </Text>
                {isActive && <Check size={20} color={colors.primary} strokeWidth={2.5} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  // ── Theme slide ────────────────────────────────────────────
  const renderThemeSlide = () => {
    const themes: { key: 'light' | 'dark' | 'system'; labelKey: string; Icon: typeof Sun }[] = [
      { key: 'light', labelKey: 'onboarding.themeLight', Icon: Sun },
      { key: 'dark', labelKey: 'onboarding.themeDark', Icon: Moon },
      { key: 'system', labelKey: 'onboarding.themeSystem', Icon: Monitor },
    ];

    return (
      <View style={styles.slideContent}>
        <AnimatedIconBox bgColor={colors.primaryLight} stepKey={step}>
          {isDark ? (
            <Moon size={48} color={colors.primary} strokeWidth={1.5} />
          ) : (
            <Sun size={48} color={colors.primary} strokeWidth={1.5} />
          )}
        </AnimatedIconBox>
        <Text style={[styles.slideTitle, { color: colors.textPrimary, ...t.displayMedium }]}>
          {tr('onboarding.chooseTheme')}
        </Text>
        <Text style={[styles.slideDesc, { color: colors.textSecondary, ...t.bodyMedium }]}>
          {tr('onboarding.chooseThemeDesc')}
        </Text>
        <View style={styles.optionsContainer}>
          {themes.map(({ key, labelKey, Icon }) => {
            const isActive = mode === key;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.7}
                onPress={() => handleThemeSelect(key)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isActive ? colors.primaryLight : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                    borderRadius: r.lg,
                  },
                ]}
              >
                <View style={styles.optionRow}>
                  <Icon size={20} color={isActive ? colors.primary : colors.textSecondary} strokeWidth={1.8} />
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colors.textPrimary, ...t.headingSmall, marginLeft: 12 },
                    ]}
                  >
                    {tr(labelKey)}
                  </Text>
                </View>
                {isActive && <Check size={20} color={colors.primary} strokeWidth={2.5} />}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (step) {
      case 0:
        return renderFeatureSlide(Target, 'onboarding.slide1Title', 'onboarding.slide1Desc');
      case 1:
        return renderFeatureSlide(Cpu, 'onboarding.slide2Title', 'onboarding.slide2Desc');
      case 2:
        return renderFeatureSlide(Briefcase, 'onboarding.slide3Title', 'onboarding.slide3Desc');
      case 3:
        return renderLanguageSlide();
      case 4:
        return renderThemeSlide();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Theme flash overlay */}
      <ThemeFlash trigger={themeFlashCount} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Image source={LOGO_ICON} style={styles.logoIcon} resizeMode="contain" />
        {!isLastStep ? (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={[{ color: colors.textTertiary, ...t.labelMedium }]}>
              {tr('common.skip')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* ── Content ── */}
      <Animated.View style={[styles.contentArea, exitStyle]}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <AnimatedSlide stepKey={step} direction={direction}>
            {renderCurrentStep()}
          </AnimatedSlide>
        </ScrollView>
      </Animated.View>

      {/* ── Bottom ── */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dotsContainer}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <AnimatedDot key={i} active={i === step} color={colors.primary} />
          ))}
        </View>

        <View style={[styles.buttonRow, { paddingHorizontal: s.xl }]}>
          {/* Back button */}
          <TouchableOpacity
            onPress={handleBack}
            activeOpacity={0.7}
            disabled={isFirstStep || isAnimating}
            style={[
              styles.backBtn,
              {
                backgroundColor: isFirstStep ? 'transparent' : colors.surfaceSecondary,
                borderRadius: r.lg,
                opacity: isFirstStep ? 0 : 1,
              },
            ]}
          >
            <ChevronLeft size={20} color={colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>

          {/* Next / Get Started */}
          <View style={styles.nextBtnWrap}>
            <Button
              title={isLastStep ? tr('onboarding.getStarted') : tr('common.next')}
              onPress={handleNext}
              variant="primary"
              size="lg"
              icon={
                isLastStep ? (
                  <ChevronRight size={18} color="#FFFFFF" strokeWidth={2.5} />
                ) : undefined
              }
              iconPosition="right"
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  logoIcon: {
    width: 44,
    height: 44,
  },
  skipBtn: {
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  contentArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  slideAnimated: {
    width: '100%',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 32,
    width: '100%',
    maxWidth: 440,
  },
  iconContainer: {
    width: 110,
    height: 110,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    textAlign: 'center',
    marginBottom: 12,
  },
  slideDesc: {
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 22,
  },
  optionsContainer: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderWidth: 1.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionLabel: {},
  bottomSection: {
    paddingTop: 16,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtnWrap: {
    flex: 1,
  },
});
