import React, { useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@/theme/ThemeContext';

interface SwipeableRowProps {
  children: React.ReactNode;
  onDelete: () => void;
}

const ACTION_WIDTH = 96;

export function SwipeableRow({ children, onDelete }: SwipeableRowProps) {
  const { colors, radius: r, typography: t } = useTheme();
  const { t: tr } = useTranslation();
  const translateX = useRef(new Animated.Value(0)).current;
  const [isOpen, setIsOpen] = useState(false);

  const open = () => {
    setIsOpen(true);
    Animated.spring(translateX, {
      toValue: -ACTION_WIDTH,
      useNativeDriver: true,
      bounciness: 0,
    }).start();
  };

  const close = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 0,
    }).start(({ finished }) => {
      if (finished) {
        setIsOpen(false);
      }
    });
  };

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponderCapture: () => isOpen,
        onPanResponderGrant: () => {
          if (isOpen) {
            close();
          }
        },
        onMoveShouldSetPanResponder: (_event, gestureState) =>
          Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
          && (gestureState.dx < -8 || (isOpen && gestureState.dx > 8)),
        onPanResponderMove: (_event, gestureState) => {
          const nextValue = isOpen
            ? -ACTION_WIDTH + gestureState.dx
            : gestureState.dx;

          translateX.setValue(Math.max(-ACTION_WIDTH, Math.min(0, nextValue)));
        },
        onPanResponderRelease: (_event, gestureState) => {
          if (gestureState.dx < -ACTION_WIDTH / 2) {
            open();
          } else if (isOpen && gestureState.dx > ACTION_WIDTH / 3) {
            close();
          } else {
            if (isOpen) {
              open();
            } else {
              close();
            }
          }
        },
        onPanResponderTerminate: close,
      }),
    [close, isOpen, translateX]
  );

  return (
    <View style={[styles.container, { borderRadius: r.lg }]}> 
      <View
        pointerEvents={isOpen ? 'auto' : 'none'}
        style={[
          styles.actionContainer,
          { borderRadius: r.lg },
        ]}
      > 
        <TouchableOpacity
          activeOpacity={0.85}
          onPress={() => {
            close();
            onDelete();
          }}
          style={[styles.actionButton, { backgroundColor: colors.buttonDestructive, borderRadius: r.xl }]}
        >
          <Trash2 size={18} color="#FFFFFF" strokeWidth={2} />
          <Text style={[{ color: '#FFFFFF', marginTop: 6 }, t.caption]}>{tr('common.delete')}</Text>
        </TouchableOpacity>
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.content, { transform: [{ translateX }] }]}
      >
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { overflow: 'hidden' },
  actionContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: ACTION_WIDTH,
    alignItems: 'flex-end',
    justifyContent: 'center',
    paddingRight: 8,
    zIndex: 2,
  },
  actionButton: {
    width: 72,
    minHeight: 76,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  content: { zIndex: 1 },
});
