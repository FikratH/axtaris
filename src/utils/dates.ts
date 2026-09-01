import i18n from '@/i18n';

const LOCALE_TAGS: Record<string, string> = {
  az: 'az-AZ',
  ru: 'ru-RU',
  en: 'en-GB',
};

/** BCP-47 tag for the CURRENT in-app language (not the device locale). */
export function currentLocaleTag(): string {
  return LOCALE_TAGS[i18n.language] ?? LOCALE_TAGS.az;
}

/** Format a date following the in-app language, so dates match the UI language. */
export function formatDate(value: string | number | Date, options?: Intl.DateTimeFormatOptions): string {
  return new Date(value).toLocaleDateString(currentLocaleTag(), options);
}

/** Format a time (hh:mm) following the in-app language. */
export function formatTime(value: string | number | Date): string {
  return new Date(value).toLocaleTimeString(currentLocaleTag(), {
    hour: '2-digit',
    minute: '2-digit',
  });
}
