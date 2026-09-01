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
  FadeInLeft,
  FadeInRight,
  FadeOutLeft,
  FadeOutRight,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '@/store/appStore';
import { changeLanguage, languages, LanguageCode } from '@/i18n';
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
  Sparkles,
  MapPin,
  TrendingUp,
} from 'lucide-react-native';

const LOGO_ICON = require('@/assets/axtaris_logo_icon_png.png');

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TOTAL_STEPS = 5;
const SLIDE_DURATION = 320;

// The per-slide animated wrapper was replaced by keyed entering/exiting
// transitions on the content container — exit and entrance now overlap on the
// UI thread instead of being sequenced with timeouts.

// ── Animated progress segment (replaces plain dots) ──────────
function ProgressSegment({ active, done, color }: { active: boolean; done: boolean; color: string }) {
  const w = useSharedValue(active ? 28 : 8);
  const o = useSharedValue(active || done ? 1 : 0.25);

  useEffect(() => {
    w.value = withSpring(active ? 28 : 8, { damping: 16, stiffness: 220 });
    o.value = withTiming(active || done ? 1 : 0.25, { duration: 250 });
  }, [active, done]);

  const style = useAnimatedStyle(() => ({ width: w.value, opacity: o.value }));
  return <Animated.View style={[styles.segment, { backgroundColor: color }, style]} />;
}

// ── A small product-hint chip that drifts around the hero ────
function FloatingChip({
  icon,
  label,
  color,
  bg,
  position,
  index,
  stepKey,
}: {
  icon: React.ReactNode;
  label: string;
  color: string;
  bg: string;
  position: object;
  index: number;
  stepKey: number;
}) {
  const enter = useSharedValue(0);

  useEffect(() => {
    enter.value = 0;
    // Settle cleanly, no overshoot, then stay put (no perpetual drift).
    enter.value = withDelay(220 + index * 90, withSpring(1, { damping: 18, stiffness: 150 }));
  }, [stepKey]);

  const style = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 10 }, { scale: 0.92 + enter.value * 0.08 }],
  }));

  return (
    <Animated.View style={[styles.chip, position, { backgroundColor: bg }, style]}>
      {icon}
      <Text style={[styles.chipText, { color }]} numberOfLines={1}>
        {label}
      </Text>
    </Animated.View>
  );
}

// ── The signature hero: layered aura glow + glass tile + chips ─
function HeroAura({
  Icon,
  accent,
  accentSoft,
  surface,
  border,
  chips,
  stepKey,
}: {
  Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
  accent: string;
  accentSoft: string;
  surface: string;
  border: string;
  chips: { icon: React.ReactNode; label: string; color: string; bg: string; position: object }[];
  stepKey: number;
}) {
  const scale = useSharedValue(0.82);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = 0.82;
    opacity.value = 0;
    // Smooth, well-damped settle (no bounce) — then rest. No perpetual float.
    scale.value = withDelay(60, withSpring(1, { damping: 18, stiffness: 140 }));
    opacity.value = withDelay(60, withTiming(1, { duration: 360, easing: Easing.out(Easing.quad) }));
  }, [stepKey]);

  const tileStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));
  const auraStyle = useAnimatedStyle(() => ({
    opacity: opacity.value * 0.5,
    transform: [{ scale: 0.9 + scale.value * 0.1 }],
  }));

  return (
    <View style={styles.heroWrap}>
      <Animated.View style={[styles.auraOuter, { backgroundColor: accentSoft }, auraStyle]} />
      <Animated.View style={[styles.auraInner, { backgroundColor: accentSoft }, auraStyle]} />

      {chips.map((c, i) => (
        <FloatingChip key={i} {...c} index={i} stepKey={stepKey} />
      ))}

      <Animated.View
        style={[
          styles.heroTile,
          {
            backgroundColor: surface,
            borderColor: border,
            shadowColor: accent,
          },
          tileStyle,
        ]}
      >
        <LinearGradient
          colors={[accentSoft, 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Icon size={46} color={accent} strokeWidth={1.7} />
      </Animated.View>
    </View>
  );
}

// ── Full-width gradient CTA ──────────────────────────────────
function GradientButton({
  title,
  onPress,
  colors,
  showArrow,
}: {
  title: string;
  onPress: () => void;
  colors: [string, string];
  showArrow?: boolean;
}) {
  const scale = useSharedValue(1);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={style}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={() => (scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }))}
        onPressOut={() => (scale.value = withSpring(1, { damping: 15, stiffness: 300 }))}
      >
        <LinearGradient
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cta}
        >
          <Text style={styles.ctaText}>{title}</Text>
          {showArrow && <ChevronRight size={20} color="#FFFFFF" strokeWidth={2.5} style={{ marginLeft: 6 }} />}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Theme switch flash overlay ───────────────────────────────
function ThemeFlash({ trigger }: { trigger: number }) {
  const { colors } = useTheme();
  const flashOpacity = useSharedValue(0);

  useEffect(() => {
    if (trigger === 0) return;
    flashOpacity.value = 0.35;
    flashOpacity.value = withTiming(0, { duration: 500, easing: Easing.out(Easing.quad) });
  }, [trigger]);

  const style = useAnimatedStyle(() => ({ opacity: flashOpacity.value }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }, style]}
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

  // Keyed entering/exiting transitions (below) run the old slide's exit and
  // the new slide's entrance simultaneously on the UI thread — no timeout
  // choreography, and the new slide's mount cost is hidden under the exit
  // instead of stalling between two animations.
  const animateTransition = useCallback(
    (nextStep: number, dir: 'forward' | 'backward') => {
      if (isAnimating) return;
      setIsAnimating(true);
      setDirection(dir);
      setStep(nextStep);
      setTimeout(() => setIsAnimating(false), SLIDE_DURATION * 0.75);
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

  const isLastStep = step === TOTAL_STEPS - 1;
  const isFirstStep = step === 0;

  // Per-step accent so each slide has its own character (brand navy ↔ teal).
  const accentFor = (i: number) => {
    const teal = i === 1 || i === 3;
    return {
      accent: teal ? colors.accent : colors.primary,
      accentSoft: teal ? colors.accentLight : colors.primaryLight,
    };
  };
  const { accent, accentSoft } = accentFor(step);
  const tileBorder = isDark ? colors.border : colors.borderLight;

  // ── Feature slide ──────────────────────────────────────────
  const renderFeatureSlide = (
    Icon: React.ComponentType<{ size: number; color: string; strokeWidth: number }>,
    titleKey: string,
    descKey: string,
    chips: { icon: React.ReactNode; label: string; color: string; bg: string; position: object }[]
  ) => (
    <View style={styles.slideContent}>
      <HeroAura
        Icon={Icon}
        accent={accent}
        accentSoft={accentSoft}
        surface={colors.surface}
        border={tileBorder}
        chips={chips}
        stepKey={step}
      />
      <Text style={[styles.slideTitle, { color: colors.textPrimary, ...t.displayLarge }]}>
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
        <HeroAura
          Icon={Globe}
          accent={accent}
          accentSoft={accentSoft}
          surface={colors.surface}
          border={tileBorder}
          chips={[]}
          stepKey={step}
        />
        <Text style={[styles.slideTitle, { color: colors.textPrimary, ...t.displayMedium }]}>
          {tr('onboarding.chooseLanguage')}
        </Text>
        <Text style={[styles.slideDesc, { color: colors.textSecondary, ...t.bodyMedium, marginBottom: 4 }]}>
          {tr('onboarding.chooseLanguageDesc')}
        </Text>
        <View style={styles.optionsContainer}>
          {langEntries.map(([code, lang]) => {
            const isActive = currentLang === code;
            return (
              <TouchableOpacity
                key={code}
                activeOpacity={0.8}
                onPress={() => handleLanguageSelect(code)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isActive ? accentSoft : colors.surface,
                    borderColor: isActive ? accent : colors.border,
                    borderRadius: r.lg,
                  },
                ]}
              >
                <Text style={[styles.optionLabel, { color: colors.textPrimary, ...t.headingSmall }]}>
                  {lang.nativeLabel}
                </Text>
                <CheckDot active={isActive} color={accent} border={colors.border} />
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
        <HeroAura
          Icon={isDark ? Moon : Sun}
          accent={accent}
          accentSoft={accentSoft}
          surface={colors.surface}
          border={tileBorder}
          chips={[]}
          stepKey={step}
        />
        <Text style={[styles.slideTitle, { color: colors.textPrimary, ...t.displayMedium }]}>
          {tr('onboarding.chooseTheme')}
        </Text>
        <Text style={[styles.slideDesc, { color: colors.textSecondary, ...t.bodyMedium, marginBottom: 4 }]}>
          {tr('onboarding.chooseThemeDesc')}
        </Text>
        <View style={styles.optionsContainer}>
          {themes.map(({ key, labelKey, Icon }) => {
            const isActive = mode === key;
            return (
              <TouchableOpacity
                key={key}
                activeOpacity={0.8}
                onPress={() => handleThemeSelect(key)}
                style={[
                  styles.optionCard,
                  {
                    backgroundColor: isActive ? accentSoft : colors.surface,
                    borderColor: isActive ? accent : colors.border,
                    borderRadius: r.lg,
                  },
                ]}
              >
                <View style={styles.optionRow}>
                  <Icon size={20} color={isActive ? accent : colors.textSecondary} strokeWidth={1.8} />
                  <Text
                    style={[
                      styles.optionLabel,
                      { color: colors.textPrimary, ...t.headingSmall, marginLeft: 12 },
                    ]}
                  >
                    {tr(labelKey)}
                  </Text>
                </View>
                <CheckDot active={isActive} color={accent} border={colors.border} />
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
        return renderFeatureSlide(Target, 'onboarding.slide1Title', 'onboarding.slide1Desc', [
          {
            icon: <Sparkles size={13} color={colors.accent} strokeWidth={2.2} />,
            label: 'AI',
            color: colors.accent,
            bg: colors.accentLight,
            position: { top: 6, right: 18 },
          },
          {
            icon: <TrendingUp size={13} color={colors.success} strokeWidth={2.2} />,
            label: '75%',
            color: colors.success,
            bg: colors.successLight,
            position: { bottom: 14, left: 8 },
          },
        ]);
      case 1:
        return renderFeatureSlide(Cpu, 'onboarding.slide2Title', 'onboarding.slide2Desc', [
          {
            icon: <Sparkles size={13} color={colors.primary} strokeWidth={2.2} />,
            label: 'AI',
            color: colors.primary,
            bg: colors.primaryLight,
            position: { top: 10, left: 6 },
          },
        ]);
      case 2:
        return renderFeatureSlide(Briefcase, 'onboarding.slide3Title', 'onboarding.slide3Desc', [
          {
            icon: <MapPin size={13} color={colors.accent} strokeWidth={2.2} />,
            label: tr('onboarding.slide3CityBadge'),
            color: colors.accent,
            bg: colors.accentLight,
            position: { top: 8, right: 14 },
          },
        ]);
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
      {/* Branded ambient wash behind everything */}
      <LinearGradient
        colors={[accentSoft, colors.background]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 0.6 }}
        style={styles.bgWash}
        pointerEvents="none"
      />

      <ThemeFlash trigger={themeFlashCount} />

      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Image source={LOGO_ICON} style={styles.logoIcon} resizeMode="contain" />
        {!isLastStep ? (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7} style={styles.skipBtn}>
            <Text style={[{ color: colors.textTertiary, ...t.labelMedium }]}>{tr('common.skip')}</Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      {/* ── Content ── */}
      <View style={styles.contentArea}>
        <Animated.View
          key={step}
          style={StyleSheet.absoluteFill}
          entering={(direction === 'forward' ? FadeInRight : FadeInLeft)
            .duration(SLIDE_DURATION)
            .easing(Easing.out(Easing.cubic))}
          exiting={(direction === 'forward' ? FadeOutLeft : FadeOutRight)
            .duration(SLIDE_DURATION * 0.55)
            .easing(Easing.in(Easing.cubic))}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.slideAnimated}>{renderCurrentStep()}</View>
          </ScrollView>
        </Animated.View>
      </View>

      {/* ── Bottom ── */}
      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.dotsContainer}>
          {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
            <ProgressSegment key={i} active={i === step} done={i < step} color={accent} />
          ))}
        </View>

        <View style={[styles.buttonRow, { paddingHorizontal: s.xl }]}>
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

          <View style={styles.nextBtnWrap}>
            <GradientButton
              title={isLastStep ? tr('onboarding.getStarted') : tr('common.next')}
              onPress={handleNext}
              colors={[colors.primary, isDark ? colors.accent : colors.primaryDark]}
              showArrow={isLastStep}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

// A round check indicator used by the language/theme option cards.
function CheckDot({ active, color, border }: { active: boolean; color: string; border: string }) {
  return (
    <View
      style={[
        styles.checkDot,
        {
          backgroundColor: active ? color : 'transparent',
          borderColor: active ? color : border,
        },
      ]}
    >
      {active && <Check size={13} color="#FFFFFF" strokeWidth={3} />}
    </View>
  );
}

const HERO_SIZE = 220;

const styles = StyleSheet.create({
  container: { flex: 1 },
  bgWash: { position: 'absolute', top: 0, left: 0, right: 0, height: '62%' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    zIndex: 1,
  },
  logoIcon: { width: 42, height: 42 },
  skipBtn: { paddingVertical: 8, paddingHorizontal: 8 },
  contentArea: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  slideAnimated: { width: '100%', alignItems: 'center' },
  slideContent: { alignItems: 'center', paddingHorizontal: 32, width: '100%', maxWidth: 460 },

  // Hero
  heroWrap: {
    width: HERO_SIZE,
    height: HERO_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 36,
  },
  auraOuter: {
    position: 'absolute',
    width: HERO_SIZE,
    height: HERO_SIZE,
    borderRadius: HERO_SIZE / 2,
  },
  auraInner: {
    position: 'absolute',
    width: HERO_SIZE * 0.66,
    height: HERO_SIZE * 0.66,
    borderRadius: HERO_SIZE,
  },
  heroTile: {
    width: 108,
    height: 108,
    borderRadius: 30,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 10,
  },
  chip: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    zIndex: 2,
    shadowColor: '#0A1628',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  chipText: { fontSize: 12, fontWeight: '700', letterSpacing: 0.2 },

  slideTitle: { textAlign: 'center', marginBottom: 14 },
  slideDesc: { textAlign: 'center', maxWidth: 330, lineHeight: 24 },

  optionsContainer: { width: '100%', marginTop: 28, gap: 12 },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 18,
    borderWidth: 1.5,
  },
  optionRow: { flexDirection: 'row', alignItems: 'center' },
  optionLabel: {},
  checkDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  bottomSection: { paddingTop: 16 },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 22,
    gap: 6,
  },
  segment: { height: 8, borderRadius: 4 },
  buttonRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  backBtn: { width: 54, height: 54, alignItems: 'center', justifyContent: 'center' },
  nextBtnWrap: { flex: 1 },

  // Gradient CTA
  cta: {
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctaText: { color: '#FFFFFF', fontSize: 17, fontWeight: '700', letterSpacing: 0.2 },
});
