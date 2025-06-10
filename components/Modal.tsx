
import React, { useContext } from 'react';
import { LanguageContext } from '../contexts/LanguageContext';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string; // Title should be passed already translated
  children: React.ReactNode;
  footerContent?: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footerContent }) => {
  const { translate } = useContext(LanguageContext)!;
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex justify-center items-center z-50 p-1 md:p-2">
      <div 
        className={`bg-slate-800 rounded-lg shadow-xl 
                    w-full max-w-lg md:max-w-xl lg:max-w-2xl 
                    h-auto max-h-[90vh] md:max-h-[80vh]
                    flex flex-col overflow-hidden`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-slate-700">
          <h3 id="modal-title" className="text-xl md:text-3xl font-semibold text-slate-200">{title}</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 text-3xl md:text-4xl"
            aria-label={translate('modal.closeButton.ariaLabel')}
          >
            &times;
          </button>
        </div>
        <div className="flex-grow overflow-y-auto"> 
          {children}
        </div>
        {footerContent && (
          <div className="flex-shrink-0 p-4 border-t border-slate-700 flex justify-end space-x-3 bg-slate-850 rounded-b-lg">
            {footerContent}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;