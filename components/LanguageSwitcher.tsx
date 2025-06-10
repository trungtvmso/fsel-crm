
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';
import { Language } from '../types';

const LanguageSwitcher: React.FC = () => {
  const context = useContext(LanguageContext);

  if (!context) {
    return null; // Should not happen if provider is set up correctly
  }

  const { language, setLanguage, translate } = context;

  const toggleLanguage = (lang: Language) => {
    setLanguage(lang);
  };

  return (
    <div className="flex items-center space-x-2 p-1 rounded-md bg-slate-700 shadow">
      <button
        onClick={() => toggleLanguage('vi')}
        title={translate('languageSwitcher.toggleToVietnamese')}
        className={`px-2 py-1 rounded-md text-sm transition-colors
                    ${language === 'vi' ? 'bg-indigo-500 text-white shadow-inner' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
        aria-pressed={language === 'vi'}
      >
        <img src="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/vn.svg" alt="VN Flag" className="w-5 h-auto inline-block" />
        <span className="ml-1.5 hidden sm:inline">VI</span>
      </button>
      <button
        onClick={() => toggleLanguage('en')}
        title={translate('languageSwitcher.toggleToEnglish')}
        className={`px-2 py-1 rounded-md text-sm transition-colors
                    ${language === 'en' ? 'bg-indigo-500 text-white shadow-inner' : 'bg-slate-600 text-slate-300 hover:bg-slate-500'}`}
        aria-pressed={language === 'en'}
      >
        <img src="https://cdnjs.cloudflare.com/ajax/libs/flag-icon-css/3.5.0/flags/4x3/gb.svg" alt="GB Flag" className="w-5 h-auto inline-block" />
        <span className="ml-1.5 hidden sm:inline">EN</span>
      </button>
    </div>
  );
};

export default LanguageSwitcher;
