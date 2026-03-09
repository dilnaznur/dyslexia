import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './en.json';
import ru from './ru.json';
import kz from './kz.json';

const savedLang = localStorage.getItem('mindstep_lang') || 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ru: { translation: ru },
    kz: { translation: kz },
  },
  lng: savedLang,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

/** Map language code to Web Speech API lang tag */
export const SPEECH_LANG: Record<string, string> = {
  en: 'en-US',
  ru: 'ru-RU',
  kz: 'kk-KZ',
};

export default i18n;
