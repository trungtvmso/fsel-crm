import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { LanguageProvider } from './contexts/LanguageContext';
import { AlertSettingsProvider } from './contexts/AlertSettingsContext'; // Import AlertSettingsProvider

const appContainerElement = document.getElementById('app-container');
if (!appContainerElement) {
  throw new Error("Could not find app-container element to mount to");
}

const root = ReactDOM.createRoot(appContainerElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <AlertSettingsProvider> {/* Add AlertSettingsProvider here */}
        <App />
      </AlertSettingsProvider>
    </LanguageProvider>
  </React.StrictMode>
);