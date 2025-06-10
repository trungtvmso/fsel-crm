
import React from 'react';

interface FloatingActionButtonProps {
  onClick: () => void;
  disabled?: boolean;
  title: string;
  icon?: React.ReactNode;
}

const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({ onClick, disabled, title, icon }) => {
  const defaultIcon = (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 md:h-7 md:w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
    </svg>
  );

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className={`fixed bottom-6 right-6 md:bottom-8 md:right-8 z-40 
                  bg-green-600 hover:bg-green-700 text-white 
                  p-3 md:p-4 rounded-full shadow-lg hover:shadow-xl 
                  focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-slate-900
                  transition-all duration-150 ease-in-out
                  disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {icon || defaultIcon}
    </button>
  );
};

export default FloatingActionButton;
