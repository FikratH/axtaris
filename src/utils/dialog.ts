import { Alert as RNAlert, Platform } from 'react-native';
import i18n from '@/i18n';

/**
 * Cross-platform dialog.
 *
 * `react-native-web`'s `Alert` is a no-op (`static alert() {}`), so every
 * `Alert.alert(...)` call — confirmations, delete prompts, error toasts — does
 * nothing on the web build. This module is a drop-in replacement with the exact
 * same call signature as RN's `Alert.alert`: on native it delegates to the real
 * Alert; on web it renders a themed modal via <DialogHost /> (mounted at root).
 *
 * Usage: replace `import { Alert } from 'react-native'` with
 * `import { Alert } from '@/utils/dialog'`. Nothing else at the call site changes.
 */

export type DialogButtonStyle = 'default' | 'cancel' | 'destructive';

export interface DialogButton {
  text?: string;
  onPress?: (value?: string) => void;
  style?: DialogButtonStyle;
}

export interface DialogOptions {
  cancelable?: boolean;
}

export interface DialogRequest {
  title: string;
  message?: string;
  buttons: DialogButton[];
  cancelable: boolean;
}

type Listener = (req: DialogRequest) => void;
let host: Listener | null = null;

/** Called by <DialogHost /> so `alert()` knows where to render on web. */
export function registerDialogHost(fn: Listener | null): void {
  host = fn;
}

function webFallback(req: DialogRequest): void {
  // No host mounted yet (e.g. an alert fired during bootstrap) — degrade to the
  // browser primitives so the callbacks still fire.
  const message = [req.title, req.message].filter(Boolean).join('\n\n');
  const cancelBtn = req.buttons.find((b) => b.style === 'cancel');
  const actionBtns = req.buttons.filter((b) => b.style !== 'cancel');

  if (typeof window === 'undefined') {
    actionBtns[actionBtns.length - 1]?.onPress?.();
    return;
  }

  if (req.buttons.length > 1) {
    const ok = window.confirm(message);
    if (ok) actionBtns[actionBtns.length - 1]?.onPress?.();
    else cancelBtn?.onPress?.();
    return;
  }

  window.alert(message);
  req.buttons[0]?.onPress?.();
}

function alert(
  title: string,
  message?: string,
  buttons?: DialogButton[],
  options?: DialogOptions
): void {
  if (Platform.OS !== 'web') {
    RNAlert.alert(title, message, buttons, options);
    return;
  }

  const normalized: DialogButton[] =
    buttons && buttons.length > 0 ? buttons : [{ text: i18n.t('common.ok'), style: 'default' }];

  const req: DialogRequest = {
    title,
    message,
    buttons: normalized,
    cancelable: options?.cancelable !== false,
  };

  if (host) host(req);
  else webFallback(req);
}

/** Drop-in replacement for react-native's Alert. */
export const Alert = { alert };
