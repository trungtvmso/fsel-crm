
import React, { useContext, useState, useEffect, useCallback, ChangeEvent } from 'react';
import { AlertSettingsContext } from '../contexts/AlertSettingsContext';
import { LanguageContext } from '../contexts/LanguageContext';
import { AlertSettings, AlertTypeSetting, MessageType, AlertPosition, AppMessage, AlertLayoutSettings } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { AppMessageKey, createAppMessage } from '../src/lib/messages'; 

interface AlertSettingsPageProps {
  setGlobalMessage: (message: AppMessage | null) => void;
}

interface SelectOption {
  value: string;
  labelKey: string;
}

interface FontSizeButtonOption {
  value: string; // Tailwind class e.g., "text-xs"
  label: string; // Short label e.g., "XS"
  tooltipKey: string; // Translation key for tooltip
}

const AlertSettingsPage: React.FC<AlertSettingsPageProps> = ({ setGlobalMessage }) => {
  const { translate } = useContext(LanguageContext)!; 
  const alertContext = useContext(AlertSettingsContext);

  const [localSettings, setLocalSettings] = useState<AlertSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [pageMessage, setPageMessage] = useState<AppMessage | null>(null);

  useEffect(() => {
    if (alertContext && !alertContext.isLoading) {
      setLocalSettings(alertContext.settings ? JSON.parse(JSON.stringify(alertContext.settings)) : null);
      setIsLoading(false);
    }
  }, [alertContext]);

  const handleGlobalChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (!localSettings) return;
    const { name, value, type } = e.target;
    
    let processedValue: string | number | boolean = value;
    if (type === 'checkbox') {
      processedValue = (e.target as HTMLInputElement).checked;
    } else if (name === 'duration') {
      processedValue = parseInt(value, 10);
      if (isNaN(processedValue) || processedValue < 0) processedValue = 0; 
    }

    setLocalSettings(prev => prev ? { ...prev, [name]: processedValue } : null);
    setPageMessage(null);
  };

  const handleFontSizeChange = (fontSizeValue: string) => {
    if (!localSettings) return;
    setLocalSettings(prev => prev ? { ...prev, fontSize: fontSizeValue } : null);
    setPageMessage(null);
  };

  const toggleTextStyle = (property: 'fontWeight' | 'fontStyle' | 'textDecoration') => {
    if (!localSettings) return;
    setLocalSettings(prev => {
      if (!prev) return null;
      let newValue: string;
      switch (property) {
        case 'fontWeight':
          newValue = prev.fontWeight === 'font-bold' ? 'font-normal' : 'font-bold';
          break;
        case 'fontStyle':
          newValue = prev.fontStyle === 'italic' ? 'not-italic' : 'italic';
          break;
        case 'textDecoration':
          newValue = prev.textDecoration === 'underline' ? 'no-underline' : 'underline';
          break;
        default:
          return prev; 
      }
      return { ...prev, [property]: newValue };
    });
    setPageMessage(null);
  };

  const handleTypeSpecificChange = (
    messageType: MessageType, 
    fieldName: keyof AlertTypeSetting | keyof AlertLayoutSettings, 
    value: string,
    isLayoutField: boolean = false
  ) => {
    if (!localSettings) return;
    setLocalSettings(prev => {
      if (!prev) return null;
      const newSettings = JSON.parse(JSON.stringify(prev)) as AlertSettings;
      const typeSetting = newSettings.types[messageType];
      
      if (isLayoutField) {
        if (!typeSetting.layout) {
          typeSetting.layout = {};
        }
        (typeSetting.layout as any)[fieldName] = value === '' ? undefined : value;
      } else {
        (typeSetting as any)[fieldName] = value === '' ? undefined : value;
      }
      return newSettings;
    });
    setPageMessage(null);
  };
  
  const isValidCssColor = (colorString?: string): boolean => {
    if (!colorString || colorString.trim() === '') return true; 
    const s = new Option().style;
    s.color = colorString;
    return s.color !== '';
  };

  const isValidPixelValue = (value?: string): boolean => {
    if (!value || value.trim() === '') return true; 
    return /^\d+px$/.test(value) || value === '0';
  }

  const validateSettings = (settingsToValidate: AlertSettings | null): boolean => {
    if (!settingsToValidate) return false;
    for (const type of Object.values(MessageType)) {
        const s = settingsToValidate.types[type];
        const typeName = translate(`alertSettingsPage.typeSettings.${type}`);
        const typeErrorKey = 'alertSettingsPage.messages.invalidColor'; 
        const typeErrorPixelKey = 'alertSettingsPage.messages.invalidPixelValue';

        if (!isValidCssColor(s.backgroundColor)) {
            setPageMessage(createAppMessage({key: AppMessageKey.ADMIN_INIT_ERROR, translate, replacements: {message: translate(typeErrorKey, {field: `${typeName} - ${translate('alertSettingsPage.typeSettings.backgroundColor')}`})}, typeOverride: MessageType.ERROR}));
            return false;
        }
        if (!isValidCssColor(s.textColor)) {
            setPageMessage(createAppMessage({key: AppMessageKey.ADMIN_INIT_ERROR, translate, replacements: {message: translate(typeErrorKey, {field: `${typeName} - ${translate('alertSettingsPage.typeSettings.textColor')}`})}, typeOverride: MessageType.ERROR}));
            return false;
        }
        if (!isValidCssColor(s.borderColor)) {
            setPageMessage(createAppMessage({key: AppMessageKey.ADMIN_INIT_ERROR, translate, replacements: {message: translate(typeErrorKey, {field: `${typeName} - ${translate('alertSettingsPage.typeSettings.borderColor')}`})}, typeOverride: MessageType.ERROR}));
            return false;
        }
        if (s.borderWidth && !isValidPixelValue(s.borderWidth)) {
             setPageMessage(createAppMessage({key: AppMessageKey.ADMIN_INIT_ERROR, translate, replacements: {message: translate(typeErrorPixelKey, {field: `${typeName} - ${translate('alertSettingsPage.typeSettings.borderWidth')}`})}, typeOverride: MessageType.ERROR}));
            return false;
        }
    }
    return true;
  }

  const handleSaveSettings = useCallback(async () => {
    if (!localSettings || !alertContext || !alertContext.updateSettings) return;
    if (!validateSettings(localSettings)) return;
    setIsSaving(true);
    setPageMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 500)); 
      alertContext.updateSettings(localSettings);
      setGlobalMessage(createAppMessage({ 
        key: AppMessageKey.ADMIN_READY, 
        translate, 
        replacements:{ message: translate('alertSettingsPage.messages.saveSuccess') }, 
        typeOverride: MessageType.SUCCESS 
      }));
    } catch (error: any) {
       setGlobalMessage(createAppMessage({ key: AppMessageKey.ADMIN_INIT_ERROR, translate, replacements: { message: translate('alertSettingsPage.messages.saveError', {error: error.message}) }, typeOverride: MessageType.ERROR }));
    } finally {
      setIsSaving(false);
    }
  }, [localSettings, alertContext, translate, setGlobalMessage]);

  const handleResetSettings = useCallback(async () => {
    if (!alertContext || !alertContext.resetSettings) return;
    setIsSaving(true); 
    setPageMessage(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 300)); 
      alertContext.resetSettings();
      setGlobalMessage(createAppMessage({key: AppMessageKey.ADMIN_READY, translate, replacements: {message: translate('alertSettingsPage.messages.resetSuccess')}, typeOverride: MessageType.INFO}));
    } catch (error: any) {
      setGlobalMessage(createAppMessage({key: AppMessageKey.ADMIN_INIT_ERROR, translate, replacements: {message: translate('alertSettingsPage.messages.resetError', {error: error.message})}, typeOverride: MessageType.ERROR}));
    } finally {
      setIsSaving(false);
    }
  }, [alertContext, translate, setGlobalMessage]);


  if (isLoading || !localSettings || !alertContext) { 
    return <div className="flex justify-center items-center h-full"><LoadingSpinner text={translate('alertMessage.app.loadingDetailsShort')} /></div>;
  }
  
  const inputClass = "mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-sm";
  const labelClass = "block text-sm font-medium text-slate-300";
  const sectionTitleClass = "text-lg font-semibold text-indigo-400 border-b border-indigo-500 pb-2 mb-4";
  const typeCardClass = "bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700";

  const alertPositionValues: AlertPosition[] = ['top-left', 'top-center', 'top-right', 'bottom-left', 'bottom-center', 'bottom-right'];
  const positionsOptions = alertPositionValues.map(posKey => ({
      value: posKey,
      label: translate(`alertSettingsPage.globalSettings.positions.${posKey}`)
  }));

  const durationOptions = [
    { value: 3000, labelKey: 'alertSettingsPage.globalSettings.durations.3s' },
    { value: 5000, labelKey: 'alertSettingsPage.globalSettings.durations.5s' },
    { value: 10000, labelKey: 'alertSettingsPage.globalSettings.durations.10s' },
    { value: 0, labelKey: 'alertSettingsPage.globalSettings.durations.infinite' },
  ];
  
  const fontSizeButtonOptions: FontSizeButtonOption[] = [
    { value: 'text-xs', label: 'XS', tooltipKey: 'alertSettingsPage.globalSettings.fontSizes.xs' },
    { value: 'text-sm', label: 'S', tooltipKey: 'alertSettingsPage.globalSettings.fontSizes.sm' },
    { value: 'text-base', label: 'M', tooltipKey: 'alertSettingsPage.globalSettings.fontSizes.base' },
    { value: 'text-lg', label: 'L', tooltipKey: 'alertSettingsPage.globalSettings.fontSizes.lg' },
    { value: 'text-xl', label: 'XL', tooltipKey: 'alertSettingsPage.globalSettings.fontSizes.xl' },
  ];

  const colorInputClass = "mt-1 block w-full h-10 px-1 py-1 bg-slate-700 border border-slate-600 rounded-md focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500";

  const paddingOptions: SelectOption[] = [
    { value: 'p-4', labelKey: 'alertSettingsPage.typeSettings.options.padding.default' },
    { value: 'p-2', labelKey: 'alertSettingsPage.typeSettings.options.padding.small' },
    { value: 'p-3', labelKey: 'alertSettingsPage.typeSettings.options.padding.medium' },
    { value: 'p-6', labelKey: 'alertSettingsPage.typeSettings.options.padding.large' },
    { value: 'p-0', labelKey: 'alertSettingsPage.typeSettings.options.padding.none' },
  ];

  const shadowOptions: SelectOption[] = [
    { value: 'shadow-lg', labelKey: 'alertSettingsPage.typeSettings.options.shadow.default' },
    { value: 'shadow-md', labelKey: 'alertSettingsPage.typeSettings.options.shadow.small' },
    { value: 'shadow-xl', labelKey: 'alertSettingsPage.typeSettings.options.shadow.large' },
    { value: 'shadow-none', labelKey: 'alertSettingsPage.typeSettings.options.shadow.none' },
  ];

  const roundedOptions: SelectOption[] = [
    { value: 'rounded-lg', labelKey: 'alertSettingsPage.typeSettings.options.rounded.default' },
    { value: 'rounded-md', labelKey: 'alertSettingsPage.typeSettings.options.rounded.small' },
    { value: 'rounded-xl', labelKey: 'alertSettingsPage.typeSettings.options.rounded.large' },
    { value: 'rounded-none', labelKey: 'alertSettingsPage.typeSettings.options.rounded.none' },
  ];

  const flexOptions: SelectOption[] = [
    { value: 'flex justify-between items-center', labelKey: 'alertSettingsPage.typeSettings.options.flex.contentLeftButtonRight' },
    { value: 'flex justify-start items-center space-x-4', labelKey: 'alertSettingsPage.typeSettings.options.flex.contentButtonLeft' },
    { value: 'flex justify-center items-center', labelKey: 'alertSettingsPage.typeSettings.options.flex.contentCenterButtonRight' },
    { value: 'flex justify-end items-center space-x-4 flex-row-reverse', labelKey: 'alertSettingsPage.typeSettings.options.flex.contentRightButtonLeft' },
    { value: '', labelKey: 'alertSettingsPage.typeSettings.options.flex.noFlex' },
  ];

  const textFormatButtonClass = "px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-indigo-500";
  const activeTextFormatButtonClass = `${textFormatButtonClass} bg-indigo-600 text-white hover:bg-indigo-700`;
  const inactiveTextFormatButtonClass = `${textFormatButtonClass} bg-slate-600 text-slate-300 hover:bg-slate-500`;

  const fontSizeButtonBaseClass = "px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-700 focus:ring-indigo-500";


  return (
    <div className="p-4 md:p-6 bg-slate-850 rounded-lg shadow-xl text-slate-300 max-w-4xl mx-auto">
      <h2 className="text-2xl font-bold text-slate-100 mb-6">{translate('alertSettingsPage.title')}</h2>

      {pageMessage && (
         <div className={`p-3 mb-4 text-sm rounded-md ${pageMessage.type === MessageType.ERROR ? 'bg-red-700 text-red-100 border border-red-500' : pageMessage.type === MessageType.SUCCESS ? 'bg-green-700 text-green-100 border border-green-500' : 'bg-blue-700 text-blue-100 border border-blue-500'}`}>
            {pageMessage.text}
        </div>
      )}

      <section className="mb-8">
        <h3 className={sectionTitleClass}>{translate('alertSettingsPage.globalSettings.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          <div>
            <label htmlFor="position" className={labelClass}>{translate('alertSettingsPage.globalSettings.position')}</label>
            <select id="position" name="position" value={localSettings.position} onChange={handleGlobalChange} className={inputClass}>
              {positionsOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="duration" className={labelClass}>
              {translate('alertSettingsPage.globalSettings.duration')}
            </label>
            <select id="duration" name="duration" value={String(localSettings.duration)} onChange={handleGlobalChange} className={inputClass}>
              {durationOptions.map(opt => (
                <option key={opt.value} value={String(opt.value)}>
                  {translate(opt.labelKey)}
                </option>
              ))}
            </select>
          </div>
          
          <div className="md:col-span-1">
            <label className={labelClass}>{translate('alertSettingsPage.globalSettings.fontSizeLabel')}</label>
            <div className="mt-1 flex space-x-px rounded-md shadow-sm border border-slate-600 overflow-hidden w-min">
                {fontSizeButtonOptions.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleFontSizeChange(opt.value)}
                        className={`${localSettings.fontSize === opt.value ? activeTextFormatButtonClass : inactiveTextFormatButtonClass} ${opt.label === 'XS' ? 'rounded-l-md' : ''} ${opt.label === 'XL' ? 'rounded-r-md' : ''} w-10 h-9 flex items-center justify-center`}
                        aria-pressed={localSettings.fontSize === opt.value}
                        title={translate(opt.tooltipKey)}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>
          </div>

          <div className="md:col-span-1"> 
            <label className={labelClass}>{translate('alertSettingsPage.globalSettings.textFormattingLabel')}</label>
            <div className="mt-1 flex space-x-px rounded-md shadow-sm border border-slate-600 overflow-hidden w-min">
              <button
                type="button"
                onClick={() => toggleTextStyle('fontWeight')}
                className={`${localSettings.fontWeight === 'font-bold' ? activeTextFormatButtonClass : inactiveTextFormatButtonClass} rounded-l-md font-bold w-10 h-9 flex items-center justify-center`}
                aria-pressed={localSettings.fontWeight === 'font-bold'}
                title={translate('alertSettingsPage.globalSettings.fontWeights.bold')}
              >
                B
              </button>
              <button
                type="button"
                onClick={() => toggleTextStyle('fontStyle')}
                className={`${localSettings.fontStyle === 'italic' ? activeTextFormatButtonClass : inactiveTextFormatButtonClass} italic w-10 h-9 flex items-center justify-center`}
                aria-pressed={localSettings.fontStyle === 'italic'}
                title={translate('alertSettingsPage.globalSettings.fontStyles.italic')}
              >
                I
              </button>
              <button
                type="button"
                onClick={() => toggleTextStyle('textDecoration')}
                className={`${localSettings.textDecoration === 'underline' ? activeTextFormatButtonClass : inactiveTextFormatButtonClass} rounded-r-md underline w-10 h-9 flex items-center justify-center`}
                aria-pressed={localSettings.textDecoration === 'underline'}
                title={translate('alertSettingsPage.globalSettings.textDecorations.underline')}
              >
                U
              </button>
            </div>
          </div>


          <div className="md:col-span-2 flex items-center mt-2">
            <input type="checkbox" id="defaultShowDismissButton" name="defaultShowDismissButton" checked={localSettings.defaultShowDismissButton} onChange={handleGlobalChange} className="h-4 w-4 text-indigo-600 border-slate-500 rounded focus:ring-indigo-500" />
            <label htmlFor="defaultShowDismissButton" className={`${labelClass} ml-2 mb-0`}>{translate('alertSettingsPage.globalSettings.defaultShowDismissButton')}</label>
          </div>
        </div>
      </section>

      <section className="mb-8">
        <h3 className={sectionTitleClass}>{translate('alertSettingsPage.typeSettings.title')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.values(MessageType).map(type => {
            const typeSetting = localSettings.types[type];
            const previewStyle: React.CSSProperties = {};
            let previewLayoutClasses = "mb-4"; 
            let previewTextClasses = `${localSettings.fontSize || 'text-base'} ${localSettings.fontWeight || 'font-normal'} ${localSettings.fontStyle || 'not-italic'} ${localSettings.textDecoration || 'no-underline'}`;


            if (typeSetting) {
                if (typeSetting.backgroundColor) previewStyle.backgroundColor = typeSetting.backgroundColor;
                if (typeSetting.textColor) previewStyle.color = typeSetting.textColor;
                if (typeSetting.borderColor) {
                previewStyle.borderColor = typeSetting.borderColor;
                previewStyle.borderWidth = typeSetting.borderWidth || '1px';
                previewStyle.borderStyle = typeSetting.borderStyle || 'solid';
                previewLayoutClasses += " border"; 
                }

                if (typeSetting.layout) {
                    previewLayoutClasses += ` ${typeSetting.layout.padding || 'p-3'}`; 
                    previewLayoutClasses += ` ${typeSetting.layout.shadow || 'shadow-md'}`; 
                    previewLayoutClasses += ` ${typeSetting.layout.rounded || 'rounded-md'}`; 
                    previewLayoutClasses += ` ${typeSetting.layout.flex || 'flex justify-between items-center'}`; 
                } else {
                    previewLayoutClasses += " p-3 shadow-md rounded-md flex justify-between items-center"; 
                }
            } else {
                 previewLayoutClasses += " p-3 shadow-md rounded-md flex justify-between items-center border bg-gray-700 text-gray-200 border-gray-500"; 
            }


            return (
            <div key={type} className={typeCardClass}>
              <h4 className="text-md font-semibold text-sky-400 mb-3">{translate(`alertSettingsPage.typeSettings.${type}`)}</h4>
              <div className="space-y-3">
                <div>
                  <label htmlFor={`${type}-backgroundColor`} className={labelClass}>{translate('alertSettingsPage.typeSettings.backgroundColor')}</label>
                  <input type="color" id={`${type}-backgroundColor`} value={localSettings.types[type]?.backgroundColor || '#334155'} onChange={(e) => handleTypeSpecificChange(type, 'backgroundColor', e.target.value)} className={colorInputClass} />
                </div>
                <div>
                  <label htmlFor={`${type}-textColor`} className={labelClass}>{translate('alertSettingsPage.typeSettings.textColor')}</label>
                  <input type="color" id={`${type}-textColor`} value={localSettings.types[type]?.textColor || '#E2E8F0'} onChange={(e) => handleTypeSpecificChange(type, 'textColor', e.target.value)} className={colorInputClass} />
                </div>
                <div>
                  <label htmlFor={`${type}-borderColor`} className={labelClass}>{translate('alertSettingsPage.typeSettings.borderColor')}</label>
                  <input type="color" id={`${type}-borderColor`} value={localSettings.types[type]?.borderColor || '#475569'} onChange={(e) => handleTypeSpecificChange(type, 'borderColor', e.target.value)} className={colorInputClass} />
                </div>
                <div>
                  <label htmlFor={`${type}-borderWidth`} className={labelClass}>{translate('alertSettingsPage.typeSettings.borderWidth')}</label>
                  <input type="text" id={`${type}-borderWidth`} value={localSettings.types[type]?.borderWidth || ''} onChange={(e) => handleTypeSpecificChange(type, 'borderWidth', e.target.value)} className={inputClass} placeholder="1px" />
                </div>
                 <div>
                  <label htmlFor={`${type}-borderStyle`} className={labelClass}>{translate('alertSettingsPage.typeSettings.borderStyle')}</label>
                  <select id={`${type}-borderStyle`} value={localSettings.types[type]?.borderStyle || 'solid'} onChange={(e) => handleTypeSpecificChange(type, 'borderStyle', e.target.value)} className={inputClass}>
                    {['solid', 'dashed', 'dotted', 'none'].map(bs => (
                       <option key={bs} value={bs}>{translate(`alertSettingsPage.typeSettings.styles.${bs}` as any)}</option>
                    ))}
                  </select>
                </div>
                <fieldset className="mt-3 border border-slate-600 p-2 rounded-md">
                    <legend className="text-sm font-medium text-slate-400 px-1">{translate('alertSettingsPage.typeSettings.layoutTitle')}</legend>
                    <div className="space-y-2 mt-1">
                        <div>
                            <label htmlFor={`${type}-layout-padding`} className={labelClass}>{translate('alertSettingsPage.typeSettings.labels.padding')}</label>
                            <select id={`${type}-layout-padding`} value={localSettings.types[type]?.layout?.padding || 'p-4'} onChange={(e) => handleTypeSpecificChange(type, 'padding', e.target.value, true)} className={inputClass}>
                                {paddingOptions.map(opt => <option key={opt.value} value={opt.value}>{translate(opt.labelKey)}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor={`${type}-layout-shadow`} className={labelClass}>{translate('alertSettingsPage.typeSettings.labels.shadow')}</label>
                             <select id={`${type}-layout-shadow`} value={localSettings.types[type]?.layout?.shadow || 'shadow-lg'} onChange={(e) => handleTypeSpecificChange(type, 'shadow', e.target.value, true)} className={inputClass}>
                                {shadowOptions.map(opt => <option key={opt.value} value={opt.value}>{translate(opt.labelKey)}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor={`${type}-layout-rounded`} className={labelClass}>{translate('alertSettingsPage.typeSettings.labels.rounded')}</label>
                            <select id={`${type}-layout-rounded`} value={localSettings.types[type]?.layout?.rounded || 'rounded-lg'} onChange={(e) => handleTypeSpecificChange(type, 'rounded', e.target.value, true)} className={inputClass}>
                                {roundedOptions.map(opt => <option key={opt.value} value={opt.value}>{translate(opt.labelKey)}</option>)}
                            </select>
                        </div>
                         <div>
                            <label htmlFor={`${type}-layout-flex`} className={labelClass}>{translate('alertSettingsPage.typeSettings.labels.flex')}</label>
                            <select id={`${type}-layout-flex`} value={localSettings.types[type]?.layout?.flex || 'flex justify-between items-center'} onChange={(e) => handleTypeSpecificChange(type, 'flex', e.target.value, true)} className={inputClass}>
                                {flexOptions.map(opt => <option key={opt.value} value={opt.value}>{translate(opt.labelKey)}</option>)}
                            </select>
                        </div>
                    </div>
                </fieldset>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-600">
                <h5 className="text-sm font-medium text-slate-400 mb-2">
                  {translate('alertSettingsPage.preview.title')}
                </h5>
                <div
                  style={previewStyle}
                  className={previewLayoutClasses}
                  role="alert" 
                >
                  <span className={previewTextClasses}>{translate('alertSettingsPage.preview.sampleText')}</span>
                  {localSettings.defaultShowDismissButton && (
                    <button
                      type="button" 
                      className="ml-4 text-xl font-semibold hover:opacity-75"
                      style={{ color: typeSetting?.textColor || 'inherit' }}
                      aria-label={translate('alertMessage.dismissButton.ariaLabel')}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>

            </div>
          )})}
        </div>
      </section>

      <div className="mt-8 flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
        <button
          onClick={handleResetSettings}
          disabled={isSaving}
          className="px-4 py-2 bg-slate-600 text-slate-200 rounded-md hover:bg-slate-500 disabled:opacity-50 transition-colors"
        >
          {isSaving ? translate('alertSettingsPage.buttons.resetting') : translate('alertSettingsPage.buttons.reset')}
        </button>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 transition-colors flex items-center justify-center"
        >
          {isSaving ? <LoadingSpinner size="sm" color="white" /> : translate('alertSettingsPage.buttons.save')}
        </button>
      </div>
    </div>
  );
};

export default AlertSettingsPage;
