import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useState } from 'react';

const LANGS = [
  { code: 'en', flag: '🇬🇧', label: 'EN' },
  { code: 'ru', flag: '🇷🇺', label: 'RU' },
  { code: 'kz', flag: '🇰🇿', label: 'KZ' },
] as const;

export default function LanguageSelector() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = LANGS.find((l) => l.code === i18n.language) ?? LANGS[0];

  const switchLang = (code: string) => {
    i18n.changeLanguage(code);
    localStorage.setItem('mindstep_lang', code);
    setOpen(false);
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative inline-block text-left" style={{ zIndex: 1100 }}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 bg-white/80 hover:bg-white backdrop-blur-sm px-3 py-1.5 rounded-full shadow-md border border-gray-200 transition-colors text-sm font-semibold"
      >
        <span className="text-base">{current.flag}</span>
        <span className="text-gray-700">{current.label}</span>
        <svg className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-32 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in">
          {LANGS.map((lang) => (
            <button
              key={lang.code}
              onClick={() => switchLang(lang.code)}
              className={`w-full flex items-center gap-2 px-4 py-2.5 text-sm hover:bg-indigo-50 transition-colors ${
                lang.code === current.code ? 'bg-indigo-50 font-bold text-indigo-700' : 'text-gray-700'
              }`}
            >
              <span className="text-base">{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
