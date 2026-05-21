import { useCallback } from 'react';
import { FieldErrors, FieldValues, Path } from 'react-hook-form';
import { useTranslation } from 'react-i18next';

/**
 * Returns a helper that extracts the translated error message for a given
 * field from React Hook Form's `errors` object.
 *
 * Zod schemas use i18n keys as messages (e.g. 'validation.required'),
 * and this hook resolves them to the current locale string.
 */
export function useFieldError<T extends FieldValues>(errors: FieldErrors<T>) {
  const { t: tr } = useTranslation();

  return useCallback(
    (field: Path<T>): string | undefined => {
      const error = errors[field];
      if (!error?.message) return undefined;
      const msg = error.message as string;
      // If the message looks like an i18n key (contains a dot), translate it
      if (msg.includes('.')) {
        return tr(msg);
      }
      return msg;
    },
    [errors, tr]
  );
}
