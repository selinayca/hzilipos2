'use client';

import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import en, { type Translations } from './en';
import tr from './tr';

type Lang = 'en' | 'tr';

const TRANSLATIONS: Record<Lang, Translations> = { en, tr };
const STORAGE_KEY = 'hizlipos_lang';

interface LangContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: Translations;
}

const LangContext = createContext<LangContextValue>({
  lang: 'tr',
  setLang: () => {},
  t: tr,
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('tr');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Lang | null;
    if (stored === 'en' || stored === 'tr') setLangState(stored);
  }, []);

  function setLang(next: Lang) {
    setLangState(next);
    localStorage.setItem(STORAGE_KEY, next);
  }

  return (
    <LangContext.Provider value={{ lang, setLang, t: TRANSLATIONS[lang] }}>
      {children}
    </LangContext.Provider>
  );
}

export function useT() {
  return useContext(LangContext);
}
