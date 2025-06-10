
import React, { createContext, useState, useEffect, useCallback } from 'react';
import { Language, Translations, LanguageContextType } from '../types';

export const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const savedLang = localStorage.getItem('appLanguage') as Language | null;
    return savedLang || 'vi'; // Default to Vietnamese
  });
  const [translations, setTranslations] = useState<Translations | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTranslations = useCallback(async (lang: Language, mountedCheck: () => boolean) => {
    if (mountedCheck()) setIsLoading(true);
    try {
      const response = await fetch(`/locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      if (mountedCheck()) setTranslations(data);
    } catch (error) {
      console.error(`Could not load ${lang}.json:`, error);
      if (mountedCheck()) {
        if (lang !== 'vi') {
          try {
            const fallbackResponse = await fetch(`/locales/vi.json`);
            if (!fallbackResponse.ok) throw new Error('Fallback vi.json also failed');
            const fallbackData = await fallbackResponse.json();
            if (mountedCheck()) setTranslations(fallbackData);
          } catch (fallbackError) {
            console.error('Fallback to vi.json also failed:', fallbackError);
            if (mountedCheck()) setTranslations({});
          }
        } else {
          if (mountedCheck()) setTranslations({});
        }
      }
    } finally {
      if (mountedCheck()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    const mountedCheck = () => isMounted;

    fetchTranslations(language, mountedCheck);

    return () => {
      isMounted = false;
    };
  }, [language, fetchTranslations]);

  const setLanguage = (lang: Language) => {
    localStorage.setItem('appLanguage', lang);
    setLanguageState(lang);
  };

  const translate = useCallback((key: string, replacements?: Record<string, string>): string => {
    if (isLoading || !translations) {
      return key; 
    }
    const keys = key.split('.');
    let current: string | Translations | undefined = translations;

    for (const k of keys) {
      if (typeof current === 'object' && current !== null && k in current) {
        current = current[k];
      } else {
        console.warn(`Translation key "${key}" not found for language "${language}".`);
        return key; 
      }
    }
    
    let translatedString = typeof current === 'string' ? current : key;

    if (replacements) {
        Object.keys(replacements).forEach(placeholder => {
            translatedString = translatedString.replace(new RegExp(`{${placeholder}}`, 'g'), replacements[placeholder]);
        });
    }

    return translatedString;
  }, [translations, language, isLoading]);

  if (isLoading && !translations) {
    // Optional: Render a global loading spinner or minimal layout
  }
  
  const contextValue = {
    language,
    setLanguage,
    translations,
    translate,
  };

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  );
};
