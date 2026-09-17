import en from '../../i18n/en/common.json';
import ko from '../../i18n/ko/common.json';
import ja from '../../i18n/ja/common.json';
import zh from '../../i18n/zh-CN/common.json';
import vi from '../../i18n/vi/common.json';
import { Atom } from '../../core/state/atom';
import { useAtom } from '../../core/state/useAtom';
export const languages = ['ko', 'en', 'ja', 'zh-CN', 'vi'] as const;
export type Language = (typeof languages)[number];
export type TranslationKey = keyof typeof en;
export const languageLabels: Record<Language, string> = {
  ko: '한국어',
  en: 'English',
  ja: '日本語',
  'zh-CN': '简体中文',
  vi: 'Tiếng Việt',
};
export const dictionaries: Record<Language, Record<TranslationKey, string>> = {
  en,
  ko,
  ja,
  'zh-CN': zh,
  vi,
};
export const locale = new Atom<Language>('ko');
export function translate(
  key: string,
  language = locale.get(),
  values?: Record<string, string | number>,
): string {
  const text = dictionaries[language][key as TranslationKey] ?? en[key as TranslationKey] ?? key;
  return text.replace(/\{(\w+)\}/g, (_, name: string) =>
    String(values?.[name] ?? '{' + name + '}'),
  );
}
export function useTranslation() {
  const language = useAtom(locale);
  return {
    language,
    t: (key: string, values?: Record<string, string | number>) => translate(key, language, values),
  };
}
export function setLanguage(language: Language) {
  locale.set(language);
  document.documentElement.lang = language;
}
