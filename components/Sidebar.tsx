
import React, { useContext } from 'react';
import { ActiveView } from '../App';
import { LanguageContext } from '../contexts/LanguageContext';

interface SidebarProps {
  activeView: ActiveView;
  setActiveView: (view: ActiveView) => void;
  isMobileMenuOpen: boolean;
  closeMobileMenu: () => void;
}

interface NavItemProps {
  view: ActiveView;
  labelKey: string;
  icon: React.ReactNode;
  currentView: ActiveView;
  onClick: (view: ActiveView) => void;
}

const NavItem: React.FC<NavItemProps> = ({ view, labelKey, icon, currentView, onClick }) => {
  const { translate } = useContext(LanguageContext)!;
  const isActive = currentView === view;
  return (
    <li>
      <button
        onClick={() => onClick(view)}
        className={`flex items-center w-full px-3 py-3 text-sm md:text-base rounded-md transition-colors duration-150
                    ${isActive 
                      ? 'bg-indigo-600 text-white shadow-md' 
                      : 'text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                    }`}
        aria-current={isActive ? 'page' : undefined}
      >
        <span className="mr-2 md:mr-3">{icon}</span>
        {translate(labelKey)}
      </button>
    </li>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView, isMobileMenuOpen, closeMobileMenu }) => {
  const { translate } = useContext(LanguageContext)!;

  const handleNavItemClick = (view: ActiveView) => {
    setActiveView(view);
    if (isMobileMenuOpen) {
      closeMobileMenu();
    }
  };

  return (
    <aside 
      id="sidebar-nav"
      className={`
        w-64 bg-slate-800 p-3 md:p-4 space-y-4 md:space-y-6 flex-shrink-0 
        shadow-lg border-r border-slate-700 flex flex-col
        fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:sticky md:translate-x-0 md:z-auto md:top-0 md:h-screen 
      `}
    >
      <div className="flex items-center justify-between mb-2 md:mb-4">
        <div className="flex items-center space-x-2 md:space-x-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 md:h-8 md:w-8 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v11.494m0 0a7.5 7.5 0 100-11.494A7.5 7.5 0 0012 17.747zM12 6.253c2.455-1.871 5.775-1.615 7.89 1.056 2.284 2.865.81 7.037-2.47 8.544M12 6.253c-2.455-1.871-5.775-1.615-7.89 1.056C1.826 10.174.352 14.346 2.63 15.85M12 17.747c-2.455 1.871-5.775-1.615-7.89-1.056C1.826 13.826.352 9.654 2.63 8.15" />
          </svg>
          <h1 className="text-lg md:text-xl font-bold text-slate-100 tracking-tight truncate" title={translate('app.title')}>
            {translate('app.titleShort')}
          </h1>
        </div>
        <button
          className="text-slate-400 hover:text-white p-1 md:hidden"
          onClick={closeMobileMenu}
          aria-label={translate('sidebar.closeMenu')}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
        </button>
      </div>
      <nav>
        <ul className="space-y-2">
          <NavItem
            view="studentManagement"
            labelKey="sidebar.studentManagement"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            }
            currentView={activeView}
            onClick={handleNavItemClick}
          />
          <NavItem
            view="courseInformation"
            labelKey="sidebar.courseInformation"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
            }
            currentView={activeView}
            onClick={handleNavItemClick}
          />
          <NavItem
            view="productPackages"
            labelKey="sidebar.productPackages"
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            }
            currentView={activeView}
            onClick={handleNavItemClick}
          />
          <NavItem
            view="alertSettings"
            labelKey="sidebar.alertSettings" 
            icon={
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            }
            currentView={activeView}
            onClick={handleNavItemClick}
          />
        </ul>
      </nav>
      <div className="mt-auto pt-4 border-t border-slate-700">
        {/* User info or logout can go here */}
      </div>
    </aside>
  );
};

export default Sidebar;