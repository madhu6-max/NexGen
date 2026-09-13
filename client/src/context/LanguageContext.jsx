import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations } from '../translations';

const LanguageContext = createContext(null);

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', native: 'English', flag: '🇮🇳', locale: 'en-IN' },
  { code: 'hi', name: 'Hindi', native: 'हिंदी', flag: '🇮🇳', locale: 'hi-IN' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు', flag: '🇮🇳', locale: 'te-IN' }
];

export const LanguageProvider = ({ children }) => {
  const [language, setLanguageState] = useState(() => {
    return localStorage.getItem('agrilink_lang') || 'en';
  });

  useEffect(() => {
    localStorage.setItem('agrilink_lang', language);
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (newLang) => {
    if (translations[newLang]) {
      setLanguageState(newLang);
    }
  };

  // Translation helper: t('nav.overview') -> 'Overview' or 'अवलोकन' or 'ముఖ్యాంశాలు'
  const t = (path, fallback = '') => {
    if (!path) return fallback;
    const parts = path.split('.');

    let current = translations[language];
    for (const part of parts) {
      if (current && current[part] !== undefined) {
        current = current[part];
      } else {
        current = null;
        break;
      }
    }

    if (current !== null && current !== undefined) {
      return current;
    }

    // Fallback to English
    let enCurrent = translations.en;
    for (const part of parts) {
      if (enCurrent && enCurrent[part] !== undefined) {
        enCurrent = enCurrent[part];
      } else {
        enCurrent = null;
        break;
      }
    }

    return (enCurrent !== null && enCurrent !== undefined) ? enCurrent : (fallback || path);
  };

  const currentConfig = AVAILABLE_LANGUAGES.find(l => l.code === language) || AVAILABLE_LANGUAGES[0];

  return (
    <LanguageContext.Provider value={{
      language,
      setLanguage,
      t,
      currentLocale: currentConfig.locale,
      currentLanguage: currentConfig,
      availableLanguages: AVAILABLE_LANGUAGES,
      translations: translations[language] || translations.en
    }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
