
import React, { useState, useContext, useRef, useEffect } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

interface SearchBarProps {
  onSearch: (searchTerm: string) => void;
  isLoading: boolean;
  direction?: 'row' | 'column';
  initialValue?: string;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading, direction = 'column', initialValue }) => {
  const [searchTerm, setSearchTerm] = useState(initialValue || '');
  const { translate } = useContext(LanguageContext)!;
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Update local searchTerm ONLY when initialValue prop changes from parent.
    // This effect ensures that if the parent component updates the `initialValue`
    // (e.g., after a search or by clearing it), the `SearchBar`'s displayed text updates accordingly.
    // It does NOT run when the user is typing into the input field (which only modifies the local `searchTerm` state).
    if (initialValue !== undefined) {
      // Only update if the provided initialValue is different from the current local state.
      // This prevents an unnecessary re-render or potential issues if they are already in sync.
      if (initialValue !== searchTerm) {
        setSearchTerm(initialValue);
      }
    }
  }, [initialValue]); // CRITICAL: Only depend on initialValue


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchTerm);
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    onSearch(''); // Optionally trigger search with empty term to clear results
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const isRowLayout = direction === 'row';
  const inputId = isRowLayout ? "searchInputHeader" : "searchInputMain";

  return (
    <form 
      onSubmit={handleSubmit} 
      className={isRowLayout ? 'w-full' : 'p-4 bg-slate-850 shadow-lg rounded-lg'}
      role="search"
    >
      <div className={`flex ${isRowLayout ? 'items-center space-x-2 md:space-x-3' : 'flex-col space-y-3'}`}>
        {isRowLayout ? (
          <label htmlFor={inputId} className="sr-only text-sm text-slate-300 whitespace-nowrap">
            {translate('searchBar.labelShort')}
          </label>
        ) : (
          <label htmlFor={inputId} className="block text-base md:text-lg font-medium text-slate-300">
            {translate('searchBar.label')}
          </label>
        )}
        
        <div className={`relative flex items-center ${isRowLayout ? 'flex-grow' : 'w-full'}`}>
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 md:h-5 md:w-5 text-slate-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
            </svg>
          </span>
          <input
            ref={inputRef}
            type="text"
            id={inputId}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={translate('searchBar.placeholder')}
            className={`p-2 pl-10 pr-10 border border-slate-600 rounded-md focus:ring-indigo-500 focus:border-indigo-500 bg-slate-700 text-slate-200 placeholder-slate-400 text-base md:text-lg w-full`}
            disabled={isLoading}
            aria-label={translate('searchBar.placeholder')} 
          />
          {searchTerm && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 focus:outline-none"
              aria-label={translate('searchBar.clearButton.ariaLabel')}
            >
              <svg className="h-4 w-4 md:h-5 md:w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
        
        <button
          type="submit"
          className={`px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 disabled:opacity-50 text-base md:text-lg ${isRowLayout ? '' : 'w-full'}`}
          disabled={isLoading}
        >
          {isLoading ? translate('searchBar.buttonLoading') : translate('searchBar.buttonText')}
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
