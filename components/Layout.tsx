
import React, { useContext, useState } from 'react';
import Sidebar from './Sidebar';
import { ActiveView } from '../App'; 
import { LanguageContext } from '../contexts/LanguageContext';
import LanguageSwitcher from './LanguageSwitcher';
import SearchBar from './SearchBar'; // Import SearchBar
import { AppMessageKey, createAppMessage } from '../src/lib/messages'; // For search related state

interface LayoutProps {
  children: React.ReactNode;
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  
  // Search related props from App.tsx
  onSearchHeader?: (searchTerm: string) => void;
  isSearchingHeader?: boolean;
  lastSearchTermHeader?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
    children, 
    activeView, 
    setActiveView,
    onSearchHeader,
    isSearchingHeader,
    lastSearchTermHeader 
}) => {
  const { translate } = useContext(LanguageContext)!;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const getPageTitle = () => {
    switch(activeView) {
      case 'studentManagement':
        return translate('sidebar.studentManagement');
      case 'courseInformation':
        return ""; // Title is handled inside CourseInformationPage or a sub-header
      case 'alertSettings':
        return translate('sidebar.alertSettings');
      case 'productPackages':
        return translate('sidebar.productPackages'); // Title for Product Packages
      default:
        return translate('app.title');
    }
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 flex">
      <Sidebar 
        activeView={activeView} 
        setActiveView={setActiveView} 
        isMobileMenuOpen={isMobileMenuOpen}
        closeMobileMenu={toggleMobileMenu} 
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-slate-850 shadow-lg flex-shrink-0 sticky top-0 z-30 border-b border-slate-700 
                           flex flex-col">
          
          {/* SearchBar (conditionally rendered) - Placed first to appear on top */}
          {activeView === 'studentManagement' && onSearchHeader && (
            <div className="container mx-auto px-3 md:px-4 py-2 border-b border-slate-700">
              <SearchBar 
                onSearch={onSearchHeader}
                isLoading={isSearchingHeader || false}
                direction="row"
                initialValue={lastSearchTermHeader} // Pass last search term to SearchBar
              />
            </div>
          )}

          {/* Main header row: Mobile Menu Button and Page Title */}
          <div className="container mx-auto p-3 md:p-4 flex items-center">
            <button
              className="text-slate-300 hover:text-white p-2 -ml-2 mr-2 md:hidden"
              onClick={toggleMobileMenu}
              aria-label={translate('sidebar.toggleMenu')}
              aria-expanded={isMobileMenuOpen}
              aria-controls="sidebar-nav"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7"></path></svg>
            </button>
            <h1 className="text-xl md:text-2xl font-bold text-slate-100 tracking-tight flex-grow">
              {getPageTitle()}
            </h1>
          </div>
        </header>
        
        {/* Overlay for mobile menu */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden" 
            onClick={toggleMobileMenu}
            aria-hidden="true"
          ></div>
        )}

        <main className="flex-grow p-3 md:p-4 overflow-auto relative z-0">
          {children}
        </main>
        <footer className="bg-slate-800 text-slate-400 p-3 border-t border-slate-700 flex-shrink-0">
          <div className="container mx-auto flex flex-col sm:flex-row justify-between items-center text-xs md:text-sm">
            <p className="mb-1 sm:mb-0">© {new Date().getFullYear()} FSEL</p>
            <LanguageSwitcher />
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Layout;