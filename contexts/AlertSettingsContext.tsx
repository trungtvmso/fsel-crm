

import React, { createContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { AlertSettings, AlertSettingsContextType, MessageType, AlertPosition } from '../types';

export const AlertSettingsContext = createContext<AlertSettingsContextType | null>(null);

const DEFAULT_ALERT_SETTINGS: AlertSettings = {
  position: 'bottom-right',
  defaultShowDismissButton: true,
  duration: 3000, 
  fontSize: "text-base", // Default font size
  fontWeight: "font-normal", // Default font weight
  fontStyle: "not-italic", // Default font style
  textDecoration: "no-underline", // Default text decoration
  types: {
    [MessageType.INFO]: {
      backgroundColor: "rgba(30, 58, 138, 0.8)",
      borderColor: "#2563eb",
      textColor: "#bfdbfe",
      borderWidth: "1px",
      borderStyle: "solid",
      layout: { padding: "p-4", shadow: "shadow-lg", rounded: "rounded-lg", flex: "flex justify-between items-center" }
    },
    [MessageType.SUCCESS]: {
      backgroundColor: "rgba(22, 101, 52, 0.8)",
      borderColor: "#16a34a",
      textColor: "#bbf7d0",
      borderWidth: "1px",
      borderStyle: "solid",
      layout: { padding: "p-4", shadow: "shadow-lg", rounded: "rounded-lg", flex: "flex justify-between items-center" }
    },
    [MessageType.ERROR]: {
      backgroundColor: "rgba(127, 29, 29, 0.8)",
      borderColor: "#dc2626",
      textColor: "#fecaca",
      borderWidth: "1px",
      borderStyle: "solid",
      layout: { padding: "p-4", shadow: "shadow-lg", rounded: "rounded-lg", flex: "flex justify-between items-center" }
    },
    [MessageType.WARNING]: {
      backgroundColor: "rgba(113, 63, 18, 0.8)",
      borderColor: "#f59e0b",
      textColor: "#fef08a",
      borderWidth: "1px",
      borderStyle: "solid",
      layout: { padding: "p-4", shadow: "shadow-lg", rounded: "rounded-lg", flex: "flex justify-between items-center" }
    },
  }
};

const LOCAL_STORAGE_KEY = 'customAlertSettings';

export const AlertSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AlertSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSettings = useCallback(async (mountedCheck: () => boolean) => {
    if (mountedCheck()) setIsLoading(true);
    let finalSettings = { ...DEFAULT_ALERT_SETTINGS }; // Start with hardcoded defaults

    try {
      // 1. Try alert-settings.json first
      const response = await fetch('/alert-settings.json');
      if (response.ok) {
        const fileData = await response.json();
        if (fileData && typeof fileData.duration === 'number') { // Basic validation
          finalSettings = {
            ...finalSettings,
            ...fileData,
            types: { // Deep merge types
                [MessageType.INFO]: { ...finalSettings.types[MessageType.INFO], ...(fileData.types?.[MessageType.INFO] || {}) },
                [MessageType.SUCCESS]: { ...finalSettings.types[MessageType.SUCCESS], ...(fileData.types?.[MessageType.SUCCESS] || {}) },
                [MessageType.ERROR]: { ...finalSettings.types[MessageType.ERROR], ...(fileData.types?.[MessageType.ERROR] || {}) },
                [MessageType.WARNING]: { ...finalSettings.types[MessageType.WARNING], ...(fileData.types?.[MessageType.WARNING] || {}) },
            }
          };
        } else {
          console.warn("Loaded alert-settings.json is incomplete or invalid, will proceed to localStorage or defaults.");
        }
      } else {
        console.warn(`HTTP error! status: ${response.status} when fetching alert-settings.json. Proceeding to localStorage or defaults.`);
      }
    } catch (error) {
      console.error("Could not load settings from alert-settings.json, proceeding to localStorage or defaults:", error);
    }

    try {
        // 2. Try localStorage, potentially overriding file settings or defaults
        const storedSettingsJson = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (storedSettingsJson) {
            const storedSettings = JSON.parse(storedSettingsJson) as AlertSettings;
            if (storedSettings && storedSettings.types && storedSettings.position && typeof storedSettings.duration === 'number') {
                finalSettings = { // User's local storage settings take precedence
                    ...finalSettings, // This ensures defaults for any *new* top-level keys are kept
                    ...storedSettings, // Override with stored settings
                    types: { // Deep merge types again, ensuring user's type settings are prioritized
                        [MessageType.INFO]: { ...finalSettings.types[MessageType.INFO], ...(storedSettings.types?.[MessageType.INFO] || {}) },
                        [MessageType.SUCCESS]: { ...finalSettings.types[MessageType.SUCCESS], ...(storedSettings.types?.[MessageType.SUCCESS] || {}) },
                        [MessageType.ERROR]: { ...finalSettings.types[MessageType.ERROR], ...(storedSettings.types?.[MessageType.ERROR] || {}) },
                        [MessageType.WARNING]: { ...finalSettings.types[MessageType.WARNING], ...(storedSettings.types?.[MessageType.WARNING] || {}) },
                    }
                };
            } else {
                localStorage.removeItem(LOCAL_STORAGE_KEY); // Remove invalid stored settings
            }
        }
    } catch (error) {
        console.error("Error reading or parsing settings from localStorage:", error);
        localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear corrupted data
    }


    if (mountedCheck()) {
      setSettings(finalSettings);
      setIsLoading(false);
    }
  }, []);


  useEffect(() => {
    let isMounted = true;
    const mountedCheck = () => isMounted;
    loadSettings(mountedCheck);
    return () => { isMounted = false; };
  }, [loadSettings]);

  const updateSettings = useCallback((newSettings: AlertSettings) => {
    setSettings(newSettings);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(newSettings));
  }, []);

  const resetSettings = useCallback(() => {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
    // Reload settings from JSON/default by calling loadSettings again
    let isMounted = true; 
    const mountedCheck = () => isMounted;
    loadSettings(mountedCheck); // This will now correctly load defaults or file first, then apply localStorage (which is none)
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    return () => { isMounted = false; };
  }, [loadSettings]);


  return (
    <AlertSettingsContext.Provider value={{ settings, isLoading, updateSettings, resetSettings }}>
      {children}
    </AlertSettingsContext.Provider>
  );
};