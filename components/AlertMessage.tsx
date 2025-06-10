

import React, { useContext, useEffect, useState } from 'react';
import { MessageType, AppMessage, AlertTypeSetting } from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import { AlertSettingsContext } from '../contexts/AlertSettingsContext';

interface AlertMessageProps {
  message: AppMessage | null;
  onDismiss?: () => void;
}

const AlertMessage: React.FC<AlertMessageProps> = ({ message, onDismiss }) => {
  const { translate } = useContext(LanguageContext)!;
  const alertSettingsContext = useContext(AlertSettingsContext);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message && message.text) {
      setIsVisible(true); 

      const globalDuration = alertSettingsContext?.settings?.duration;

      if (globalDuration && globalDuration > 0 && onDismiss) {
        const timer = setTimeout(() => {
          setIsVisible(false);
          onDismiss(); 
        }, globalDuration);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [message, onDismiss, alertSettingsContext]);

  if (!isVisible || !message || !message.text || !alertSettingsContext || alertSettingsContext.isLoading) {
    return null;
  }

  const { settings } = alertSettingsContext;
  if (!settings) return null;

  const settingsForType: AlertTypeSetting | undefined = settings.types[message.type];

  const alertInlineStyles: React.CSSProperties = {};
  let layoutClasses = "mb-4"; 
  let textSpanClasses = `${settings.fontSize || 'text-base'} ${settings.fontWeight || 'font-normal'} ${settings.fontStyle || 'not-italic'} ${settings.textDecoration || 'no-underline'}`;


  if (settingsForType) {
    if (settingsForType.backgroundColor) alertInlineStyles.backgroundColor = settingsForType.backgroundColor;
    if (settingsForType.textColor) alertInlineStyles.color = settingsForType.textColor;
    if (settingsForType.borderColor) {
      alertInlineStyles.borderColor = settingsForType.borderColor;
      alertInlineStyles.borderWidth = settingsForType.borderWidth || '1px';
      alertInlineStyles.borderStyle = settingsForType.borderStyle || 'solid';
      layoutClasses += " border"; 
    }

    if (settingsForType.layout) {
      if (settingsForType.layout.padding) layoutClasses += ` ${settingsForType.layout.padding}`;
      else layoutClasses += ' p-4'; // Default padding if layout object exists but padding is undefined
      if (settingsForType.layout.shadow) layoutClasses += ` ${settingsForType.layout.shadow}`;
      else layoutClasses += ' shadow-md';
      if (settingsForType.layout.rounded) layoutClasses += ` ${settingsForType.layout.rounded}`;
      else layoutClasses += ' rounded-md';
      if (settingsForType.layout.flex) layoutClasses += ` ${settingsForType.layout.flex}`;
      else layoutClasses += ` flex justify-between items-center`; 
    } else {
      layoutClasses += " p-4 shadow-md rounded-md flex justify-between items-center";
    }
  } else {
    // Fallback default styling if type-specific settings are missing
    layoutClasses += " p-4 shadow-md rounded-md flex justify-between items-center border bg-gray-700 text-gray-200 border-gray-500";
    // Note: textSpanClasses will use global defaults from settings if settingsForType is missing
  }
  
  const showDismissButton = settings.defaultShowDismissButton && onDismiss;

  return (
    <div 
      className={`${layoutClasses} transition-opacity duration-300 ${isVisible ? 'opacity-100' : 'opacity-0'}`}
      style={alertInlineStyles}
      role="alert"
      aria-live={message.type === MessageType.ERROR || message.type === MessageType.WARNING ? "assertive" : "polite"}
    >
      <span className={textSpanClasses}>{message.text}</span>
      {showDismissButton && (
        <button
          onClick={() => {
            setIsVisible(false);
            if (onDismiss) onDismiss();
          }}
          className="ml-4 text-xl md:text-2xl font-semibold hover:opacity-75"
          style={{ color: settingsForType?.textColor || 'inherit' }} 
          aria-label={translate('alertMessage.dismissButton.ariaLabel')}
        >
          &times;
        </button>
      )}
    </div>
  );
};

export default AlertMessage;