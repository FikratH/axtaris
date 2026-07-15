import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/ThemeContext';
import { DialogButton, DialogRequest, registerDialogHost } from '@/utils/dialog';

/**
 * Renders the web/native modal for `@/utils/dialog`'s `Alert.alert`. Mount once
 * at the app root (inside ThemeProvider). Native still uses the OS Alert, so on
 * native this component simply never receives a request.
 */
export function DialogHost() {
  const { colors, typography: t, radius: r, spacing: s } = useTheme();
  const [request, setRequest] = useState<DialogRequest | null>(null);

  useEffect(() => {
    registerDialogHost((req) => setRequest(req));
    return () => registerDialogHost(null);
  }, []);

  const dispatch = useCallback((button: DialogButton | undefined) => {
    setRequest(null);
    // Defer the callback so the modal fully unmounts before any navigation or
    // follow-up dialog the callback might trigger.
    setTimeout(() => button?.onPress?.(), 0);
  }, []);

  const onBackdrop = useCallback(() => {
    if (!request) return;
    if (!request.cancelable) return;
    const cancel = request.buttons.find((b) => b.style === 'cancel');
    if (cancel) dispatch(cancel);
    else if (request.buttons.length === 1) dispatch(request.buttons[0]);
    else setRequest(null);
  }, [request, dispatch]);

  if (!request) return null;

  const buttons = request.buttons;
  const stacked = buttons.length > 2;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onBackdrop} statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onBackdrop}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[styles.card, { backgroundColor: colors.surface, borderRadius: r.xl, borderColor: colors.cardBorder }]}
        >
          <Text style={[styles.title, { color: colors.textPrimary }, t.headingSmall]}>{request.title}</Text>
          {request.message ? (
            <Text style={[styles.message, { color: colors.textSecondary }, t.bodyMedium]}>{request.message}</Text>
          ) : null}

          <View style={[styles.row, stacked && styles.col, { marginTop: s.xl }]}>
            {buttons.map((b, i) => {
              const destructive = b.style === 'destructive';
              const cancel = b.style === 'cancel';
              const color = destructive ? colors.error : cancel ? colors.textSecondary : colors.primary;
              return (
                <Pressable
                  key={`${b.text ?? 'ok'}-${i}`}
                  onPress={() => dispatch(b)}
                  style={({ pressed }) => [
                    styles.button,
                    stacked ? styles.buttonStacked : styles.buttonInline,
                    { backgroundColor: pressed ? colors.surfaceSecondary : 'transparent', borderRadius: r.md },
                  ]}
                >
                  <Text
                    style={[
                      { color, textAlign: 'center', fontWeight: cancel ? '500' : '700' },
                      t.labelMedium,
                    ]}
                  >
                    {b.text ?? 'OK'}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    padding: 24,
    borderWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 32,
    elevation: 12,
  },
  title: { textAlign: 'center' },
  message: { textAlign: 'center', marginTop: 10, lineHeight: 22 },
  row: { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  col: { flexDirection: 'column-reverse', gap: 6 },
  button: { paddingVertical: 12, paddingHorizontal: 18, minWidth: 88, alignItems: 'center', justifyContent: 'center' },
  buttonInline: {},
  buttonStacked: { width: '100%' },
});
