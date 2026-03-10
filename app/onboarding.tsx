import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/theme/ThemeContext';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { Target, Cpu, Briefcase } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

interface Slide {
  key: string;
  titleKey: string;
  descKey: string;
  IconComponent: React.ComponentType<{ size: number; color: string; strokeWidth: number }>;
}

const slides: Slide[] = [
  {
    key: '1',
    titleKey: 'onboarding.slide1Title',
    descKey: 'onboarding.slide1Desc',
    IconComponent: Target,
  },
  {
    key: '2',
    titleKey: 'onboarding.slide2Title',
    descKey: 'onboarding.slide2Desc',
    IconComponent: Cpu,
  },
  {
    key: '3',
    titleKey: 'onboarding.slide3Title',
    descKey: 'onboarding.slide3Desc',
    IconComponent: Briefcase,
  },
];

export default function OnboardingScreen() {
  const { colors, spacing: s, typography: t, radius: r } = useTheme();
  const { t: tr } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<FlatList>(null);

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      completeOnboarding();
    }
  };

  const handleSkip = () => {
    completeOnboarding();
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem('@axtaris_onboarded', 'true');
    router.replace('/auth/role-select');
  };

  const renderSlide = ({ item }: { item: Slide }) => (
    <View style={[styles.slide, { width }]}>
      <View style={styles.slideContent}>
        <View style={[styles.iconContainer, { backgroundColor: 'rgba(91, 127, 214, 0.1)' }]}>
          <item.IconComponent size={44} color="#5B7FD6" strokeWidth={1.5} />
        </View>
        <Text style={[styles.slideTitle, { color: '#FFFFFF', ...t.displayMedium }]}>
          {tr(item.titleKey)}
        </Text>
        <Text style={[styles.slideDesc, { color: 'rgba(255,255,255,0.6)', ...t.bodyLarge }]}>
          {tr(item.descKey)}
        </Text>
      </View>
    </View>
  );

  const renderDots = () => (
    <View style={styles.dotsContainer}>
      {slides.map((_, i) => {
        const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
        const dotWidth = scrollX.interpolate({
          inputRange,
          outputRange: [8, 24, 8],
          extrapolate: 'clamp',
        });
        const dotOpacity = scrollX.interpolate({
          inputRange,
          outputRange: [0.3, 1, 0.3],
          extrapolate: 'clamp',
        });

        return (
          <Animated.View
            key={i}
            style={[
              styles.dot,
              {
                width: dotWidth,
                opacity: dotOpacity,
                backgroundColor: '#5B7FD6',
                borderRadius: 4,
              },
            ]}
          />
        );
      })}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: '#0A1628' }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        {currentIndex < slides.length - 1 ? (
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text style={[{ color: 'rgba(255,255,255,0.5)', ...t.labelMedium }]}>
              {tr('common.skip')}
            </Text>
          </TouchableOpacity>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
          useNativeDriver: false,
        })}
        onMomentumScrollEnd={(e) => {
          setCurrentIndex(Math.round(e.nativeEvent.contentOffset.x / width));
        }}
        keyExtractor={(item) => item.key}
      />

      <View style={[styles.bottomSection, { paddingBottom: insets.bottom + 24 }]}>
        {renderDots()}
        <View style={[styles.buttonContainer, { paddingHorizontal: s.xl }]}>
          <Button
            title={currentIndex === slides.length - 1 ? tr('onboarding.getStarted') : tr('common.next')}
            onPress={handleNext}
            variant="primary"
            size="lg"
            style={{ backgroundColor: '#5B7FD6' }}
          />
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
    position: 'absolute',
    top: 0,
    right: 20,
    zIndex: 10,
  },
  slide: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  slideContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  slideTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDesc: {
    textAlign: 'center',
    maxWidth: 300,
  },
  bottomSection: {
    paddingTop: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 32,
    gap: 6,
  },
  dot: {
    height: 8,
  },
  buttonContainer: {},
});
