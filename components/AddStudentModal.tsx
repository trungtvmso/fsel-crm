
import React, { useState, useContext, useEffect } from 'react';
import Modal from './Modal';
import { AddStudentFormData, StudentSearchResultItem } from '../types'; // Added StudentSearchResultItem
import { LanguageContext } from '../contexts/LanguageContext';
import { isValidEmail, isValidPhoneNumber, formatDate } from '../utils';
import LoadingSpinner from './LoadingSpinner';
import { DEFAULT_SIGNUP_PASSWORD } from '../constants';

interface AddStudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: AddStudentFormData) => Promise<{ success: boolean; messageKey?: string; replacements?: Record<string, string>, newStudent?: StudentSearchResultItem, isValidationError?: boolean }>;
}

const AddStudentModal: React.FC<AddStudentModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const { translate } = useContext(LanguageContext)!;
  const initialFormData: AddStudentFormData = {
    fullName: '',
    email: '',
    phoneNumber: null,
    birthday: null,
    // schoolName: null, // Removed
    // studentClass: null, // Removed
  };

  const [formData, setFormData] = useState<AddStudentFormData>(initialFormData);
  const [errors, setErrors] = useState<Partial<Record<keyof AddStudentFormData, string>>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [successStudentData, setSuccessStudentData] = useState<StudentSearchResultItem | null>(null);


  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData);
      setErrors({});
      setIsLoading(false);
      setSubmissionError(null);
      setSuccessStudentData(null); // Reset success data when modal opens
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value === '' ? null : value }));
    if (errors[name as keyof AddStudentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setSubmissionError(null); 
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value || null }));
     if (errors[name as keyof AddStudentFormData]) {
      setErrors(prev => ({ ...prev, [name]: undefined }));
    }
    setSubmissionError(null);
  };


  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AddStudentFormData, string>> = {};
    if (!formData.fullName.trim()) {
      newErrors.fullName = translate('addStudentModal.validation.fullNameRequired');
    }
    if (!formData.email.trim()) {
      newErrors.email = translate('addStudentModal.validation.emailRequired');
    } else if (!isValidEmail(formData.email)) {
      newErrors.email = translate('addStudentModal.validation.emailInvalid');
    }
    if (formData.phoneNumber && !isValidPhoneNumber(formData.phoneNumber)) {
      newErrors.phoneNumber = translate('addStudentModal.validation.phoneInvalid');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmissionError(null);
    if (!validateForm()) {
      return;
    }
    setIsLoading(true);
    const result = await onSubmit(formData);
    setIsLoading(false);
    if (result.success && result.newStudent) {
      setSuccessStudentData(result.newStudent); // Show success panel
      // Global message will be handled by App.tsx
    } else {
      if (result.messageKey && result.isValidationError) { 
        setSubmissionError(translate(result.messageKey, result.replacements));
      } else if (result.messageKey) { 
         setSubmissionError(translate(result.messageKey, result.replacements));
      } else {
         setSubmissionError(translate('apiErrors.default')); 
      }
    }
  };

  const handleCloseSuccessPanel = () => {
    setSuccessStudentData(null);
    onClose();
  };

  const inputClass = "mt-1 block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 text-base";
  const labelClass = "block text-sm md:text-base font-medium text-slate-300";
  const errorTextClass = "mt-1 text-xs text-red-400";

  const renderSuccessPanel = () => {
    if (!successStudentData) return null;
    return (
      <div className="p-4 md:p-6 space-y-3 text-slate-300">
        <h4 className="text-lg md:text-xl font-semibold text-green-400 text-center">{translate('addStudentModal.successPanel.title')}</h4>
        <p className="text-sm md:text-base text-center">{translate('addStudentModal.successPanel.info')}</p>
        <div className="mt-3 space-y-2 bg-slate-700 p-3 rounded-md shadow">
          <div>
            <strong className="text-slate-400">{translate('addStudentModal.successPanel.fullName')}</strong>
            <p className="text-slate-200">{successStudentData.fullName}</p>
          </div>
          <div>
            <strong className="text-slate-400">{translate('addStudentModal.successPanel.birthday')}</strong>
            <p className="text-slate-200">{formatDate(successStudentData.birthday)}</p>
          </div>
          <div>
            <strong className="text-slate-400">{translate('addStudentModal.successPanel.username')}</strong>
            <p className="text-slate-200">{successStudentData.email}</p>
          </div>
          <div>
            <strong className="text-slate-400">{translate('addStudentModal.successPanel.password')}</strong>
            <p className="text-slate-200 font-mono">{DEFAULT_SIGNUP_PASSWORD}</p>
          </div>
        </div>
        <p className="text-xs md:text-sm text-slate-400 mt-2">{translate('addStudentModal.successPanel.note')}</p>
      </div>
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={successStudentData ? handleCloseSuccessPanel : onClose} // Custom close for success panel
      title={successStudentData ? translate('addStudentModal.successPanel.title') : translate('addStudentModal.title')}
      footerContent={
        successStudentData ? (
          <button
            type="button"
            onClick={handleCloseSuccessPanel}
            className="px-4 py-2 text-sm md:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {translate('buttons.close')}
          </button>
        ) : (
          <>
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm md:text-base bg-slate-600 text-slate-200 rounded-md hover:bg-slate-500 disabled:opacity-50"
            >
              {translate('buttons.cancel')}
            </button>
            <button
              type="submit"
              form="add-student-form"
              disabled={isLoading}
              className="px-4 py-2 text-sm md:text-base bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center min-w-[80px]"
            >
              {isLoading ? <LoadingSpinner size="sm" color="white" /> : translate('buttons.save')}
            </button>
          </>
        )
      }
    >
      {successStudentData ? renderSuccessPanel() : (
        <form id="add-student-form" onSubmit={handleSubmit} className="p-4 md:p-6 space-y-4 text-slate-300">
          {submissionError && (
            <div className="p-3 mb-3 text-sm text-red-300 bg-red-700 bg-opacity-30 border border-red-600 rounded-md" role="alert">
              {submissionError}
            </div>
          )}
          
          <div>
            <label htmlFor="fullName" className={labelClass}>{translate('addStudentModal.labels.fullName')}<span className="text-red-400">*</span></label>
            <input
              type="text"
              name="fullName"
              id="fullName"
              value={formData.fullName}
              onChange={handleChange}
              className={inputClass}
              placeholder={translate('addStudentModal.placeholders.fullName')}
              required
              aria-invalid={!!errors.fullName}
              aria-describedby={errors.fullName ? "fullName-error" : undefined}
            />
            {errors.fullName && <p id="fullName-error" className={errorTextClass}>{errors.fullName}</p>}
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>{translate('addStudentModal.labels.email')}<span className="text-red-400">*</span></label>
            <input
              type="email"
              name="email"
              id="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              placeholder={translate('addStudentModal.placeholders.email')}
              required
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-error" : undefined}
            />
            {errors.email && <p id="email-error" className={errorTextClass}>{errors.email}</p>}
          </div>

          <div>
            <label htmlFor="phoneNumber" className={labelClass}>{translate('addStudentModal.labels.phoneNumber')}</label>
            <input
              type="tel"
              name="phoneNumber"
              id="phoneNumber"
              value={formData.phoneNumber || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder={translate('addStudentModal.placeholders.phoneNumber')}
              aria-invalid={!!errors.phoneNumber}
              aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
            />
            {errors.phoneNumber && <p id="phoneNumber-error" className={errorTextClass}>{errors.phoneNumber}</p>}
          </div>

          <div>
            <label htmlFor="birthday" className={labelClass}>{translate('addStudentModal.labels.birthday')}</label>
            <input
              type="date"
              name="birthday"
              id="birthday"
              value={formData.birthday || ''}
              onChange={handleDateChange}
              className={`${inputClass} dark-date-picker`}
              placeholder={translate('addStudentModal.placeholders.birthday')}
            />
            <style>{`
              .dark-date-picker::-webkit-calendar-picker-indicator {
                filter: invert(0.8) brightness(100%);
              }
            `}</style>
          </div>
          
          <p className="text-xs md:text-sm text-slate-400 mt-4">
            {translate('addStudentModal.addStudentInfo', { defaultPassword: DEFAULT_SIGNUP_PASSWORD })}
          </p>
        </form>
      )}
    </Modal>
  );
};

export default AddStudentModal;