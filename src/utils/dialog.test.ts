// The factory must not close over outer variables: ES `import` statements are
// hoisted above local `const`s, so the mock object is built inside the factory
// and mutated through the shared (cached) module reference in each test.
jest.mock('react-native', () => ({
  Platform: { OS: 'web' },
  Alert: { alert: jest.fn() },
}));

// Avoid pulling in the full i18next/AsyncStorage stack for this pure test.
jest.mock('@/i18n', () => ({
  __esModule: true,
  default: { t: (key: string) => key },
}));

import { Platform, Alert as RNAlert } from 'react-native';
import { Alert, registerDialogHost, type DialogRequest } from '@/utils/dialog';

const rnAlertMock = RNAlert.alert as jest.Mock;

describe('dialog Alert', () => {
  let confirmMock: jest.Mock;
  let alertMock: jest.Mock;

  beforeEach(() => {
    (Platform as { OS: string }).OS = 'web';
    rnAlertMock.mockClear();
    registerDialogHost(null);
    confirmMock = jest.fn();
    alertMock = jest.fn();
    (global as unknown as { window: unknown }).window = {
      confirm: confirmMock,
      alert: alertMock,
    };
  });

  afterEach(() => {
    registerDialogHost(null);
    delete (global as unknown as { window?: unknown }).window;
  });

  describe('native platforms', () => {
    it('delegates straight to react-native Alert.alert', () => {
      (Platform as { OS: string }).OS = 'ios';
      const buttons = [{ text: 'OK' }];
      const options = { cancelable: false };
      Alert.alert('Title', 'Message', buttons, options);

      expect(rnAlertMock).toHaveBeenCalledWith('Title', 'Message', buttons, options);
      expect(confirmMock).not.toHaveBeenCalled();
    });
  });

  describe('web fallback (no host registered)', () => {
    it('routes a confirmed two-button dialog to the action button', () => {
      confirmMock.mockReturnValue(true);
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      Alert.alert('Delete?', 'This is permanent', [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Delete', style: 'destructive', onPress: onConfirm },
      ]);

      expect(confirmMock).toHaveBeenCalledTimes(1);
      expect(confirmMock).toHaveBeenCalledWith('Delete?\n\nThis is permanent');
      expect(onConfirm).toHaveBeenCalledTimes(1);
      expect(onCancel).not.toHaveBeenCalled();
    });

    it('routes a dismissed two-button dialog to the cancel button', () => {
      confirmMock.mockReturnValue(false);
      const onConfirm = jest.fn();
      const onCancel = jest.fn();

      Alert.alert('Delete?', undefined, [
        { text: 'Cancel', style: 'cancel', onPress: onCancel },
        { text: 'Delete', style: 'destructive', onPress: onConfirm },
      ]);

      expect(confirmMock).toHaveBeenCalledTimes(1);
      expect(onCancel).toHaveBeenCalledTimes(1);
      expect(onConfirm).not.toHaveBeenCalled();
    });

    it('uses window.alert and fires the single button for a one-button dialog', () => {
      const onPress = jest.fn();
      Alert.alert('Saved', 'All good', [{ text: 'OK', onPress }]);

      expect(alertMock).toHaveBeenCalledTimes(1);
      expect(alertMock).toHaveBeenCalledWith('Saved\n\nAll good');
      expect(confirmMock).not.toHaveBeenCalled();
      expect(onPress).toHaveBeenCalledTimes(1);
    });

    it('picks the last non-cancel action when confirmed with several actions', () => {
      confirmMock.mockReturnValue(true);
      const first = jest.fn();
      const last = jest.fn();
      const cancel = jest.fn();

      Alert.alert('Choose', undefined, [
        { text: 'Cancel', style: 'cancel', onPress: cancel },
        { text: 'First', onPress: first },
        { text: 'Last', onPress: last },
      ]);

      expect(last).toHaveBeenCalledTimes(1);
      expect(first).not.toHaveBeenCalled();
      expect(cancel).not.toHaveBeenCalled();
    });
  });

  describe('web with a registered host', () => {
    it('forwards the normalized request to the host instead of window', () => {
      const received: DialogRequest[] = [];
      registerDialogHost((req) => received.push(req));

      Alert.alert('Hi', 'There', [{ text: 'OK', style: 'default', onPress: jest.fn() }]);

      expect(received).toHaveLength(1);
      expect(received[0]).toMatchObject({
        title: 'Hi',
        message: 'There',
        cancelable: true,
      });
      expect(confirmMock).not.toHaveBeenCalled();
      expect(alertMock).not.toHaveBeenCalled();
    });

    it('supplies a default OK button when none are provided', () => {
      const received: DialogRequest[] = [];
      registerDialogHost((req) => received.push(req));

      Alert.alert('Just a heads up');

      expect(received[0].buttons).toHaveLength(1);
      expect(received[0].buttons[0].style).toBe('default');
    });

    it('respects cancelable:false in options', () => {
      const received: DialogRequest[] = [];
      registerDialogHost((req) => received.push(req));

      Alert.alert('Blocking', undefined, [{ text: 'OK' }], { cancelable: false });
      expect(received[0].cancelable).toBe(false);
    });
  });
});
