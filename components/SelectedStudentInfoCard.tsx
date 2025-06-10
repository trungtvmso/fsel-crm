
import React, { useContext, useState } from 'react';
import { Student, OtpData, AppMessage } from '../types';
import { formatDate, getCustomerTypeDisplay } from '../utils';
import LoadingSpinner from './LoadingSpinner';
import Modal from './Modal';
import { LanguageContext } from '../contexts/LanguageContext';
import { AppMessageKey, createAppMessage } from '../src/lib/messages'; // For global messages
import { deleteStudentAccount } from '../services/studentService'; // Service for deleting

interface SelectedStudentInfoCardProps {
  student: Student | null;
  otpData: OtpData | null;
  isLoadingOtp: boolean;
  otpError: string | null;
  onStudentAccountDeleted: (deletedStudentId: string) => void; // Callback when account is deleted
  onUpdateGlobalMessage: (message: AppMessage | null) => void; // For global notifications
}

const DetailItem: React.FC<{ label: string; value: React.ReactNode; fullWidth?: boolean; itemClassName?: string }> = ({ label, value, fullWidth, itemClassName }) => (
  <div className={`py-0.5 md:py-1 ${fullWidth ? 'col-span-2' : ''} ${itemClassName || ''}`}>
    <dt className="text-xs md:text-sm font-medium text-slate-500">{label}</dt>
    <dd className="mt-0 text-sm md:text-base text-slate-300">{value || 'N/A'}</dd>
  </div>
);

const SelectedStudentInfoCard: React.FC<SelectedStudentInfoCardProps> = ({ 
    student, 
    otpData, 
    isLoadingOtp, 
    otpError,
    onStudentAccountDeleted,
    onUpdateGlobalMessage
}) => {
  const { translate } = useContext(LanguageContext)!;
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteConfirmationInput, setDeleteConfirmationInput] = useState('');
  const [deleteModalError, setDeleteModalError] = useState<string | null>(null);

  if (!student) {
    return (
      <div className="bg-slate-800 rounded-lg h-full flex flex-col items-center justify-center p-4">
        <p className="text-slate-400 text-center text-base md:text-xl">{translate('selectedStudentInfoCard.noStudentSelected')}</p>
      </div>
    );
  }

  const OtpStatusIcon: React.FC<{ confirmed: boolean }> = ({ confirmed }) => (
    <span className={`ml-1 font-bold ${confirmed ? 'text-green-400' : 'text-red-400'}`}>
      {confirmed ? '✓' : '✗'}
    </span>
  );
  
  const doiTuongDisplay = getCustomerTypeDisplay(student.object, translate);
  const doiTuongClass = student.object === 'Leads' ? 'text-yellow-300 font-semibold' : student.object === 'Client' ? 'text-green-300 font-semibold' : 'text-slate-300';

  const handleDeleteAccountClick = () => {
    setDeleteModalError(null);
    setDeleteConfirmationInput('');
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDeleteAccount = async () => {
    if (deleteConfirmationInput !== translate('selectedStudentInfoCard.deleteAccountModal.confirmationMatchString')) {
      setDeleteModalError(translate('selectedStudentInfoCard.deleteAccountModal.invalidConfirmation'));
      return;
    }
    setDeleteModalError(null);
    setIsDeletingAccount(true);
    onUpdateGlobalMessage(createAppMessage({
      key: AppMessageKey.DELETING_ACCOUNT,
      translate,
      replacements: { fullName: student.fullName }
    }));

    const result = await deleteStudentAccount(student.id); // student.id is UserID (GUID)

    setIsDeletingAccount(false);
    if (result.success) {
      onUpdateGlobalMessage(createAppMessage({
        key: AppMessageKey.DELETE_ACCOUNT_SUCCESS,
        translate,
        replacements: { fullName: student.fullName }
      }));
      setIsDeleteModalOpen(false);
      onStudentAccountDeleted(student.id);
    } else {
      onUpdateGlobalMessage(createAppMessage({
        key: AppMessageKey.DELETE_ACCOUNT_FAILURE,
        translate,
        replacements: { message: result.message }
      }));
      // Keep modal open or set error inside modal if needed
      setDeleteModalError(result.message); 
    }
  };


  return (
    <>
      <div className="bg-slate-800 rounded-lg h-full flex flex-col">
        <div className="h-10 md:h-12 flex justify-between items-center px-2 md:px-3 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-t-lg flex-shrink-0">
            <h3 className="text-base md:text-xl font-semibold text-white flex items-center truncate">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 mr-1.5 flex-shrink-0">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0012 15.75a7.488 7.488 0 00-5.982 2.975m11.963 0a9 9 0 10-11.963 0m11.963 0A8.966 8.966 0 0112 21a8.966 8.966 0 01-5.982-2.275M15 9.75a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="truncate" title={translate('selectedStudentInfoCard.title')}>{translate('selectedStudentInfoCard.title')}</span>
            </h3>
            <button
              onClick={handleDeleteAccountClick}
              className="px-1.5 py-0.5 md:px-2 md:py-1 text-xs md:text-sm bg-red-700 text-red-100 rounded hover:bg-red-600 focus:outline-none focus:ring-1 focus:ring-red-500 focus:ring-offset-1 focus:ring-offset-slate-800 flex items-center"
              title={translate('selectedStudentInfoCard.buttons.deleteAccount')}
            >
              <span>{translate('selectedStudentInfoCard.buttons.deleteAccount')}</span>
            </button>
        </div>
        <div className="p-2 md:p-3 space-y-2 md:space-y-3 flex-grow overflow-y-auto">
          <div>
            <h4 className="text-sm md:text-lg font-semibold text-sky-400 border-b border-sky-500 border-opacity-50 pb-0.5 md:pb-1 mb-1.5 md:mb-2">
              {translate('selectedStudentInfoCard.sections.generalInfo.title')}
            </h4>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-2 md:gap-x-3 gap-y-0">
              <DetailItem label={translate('selectedStudentInfoCard.sections.generalInfo.studentCode')} value={student.studentCode} fullWidth />
              <DetailItem label={translate('selectedStudentInfoCard.sections.generalInfo.fullName')} value={student.fullName} />
              <DetailItem label={translate('selectedStudentInfoCard.sections.generalInfo.birthday')} value={formatDate(student.birthday)} />
              <DetailItem label={translate('selectedStudentInfoCard.sections.generalInfo.phoneNumber')} value={student.phoneNumber} />
              <DetailItem label={translate('selectedStudentInfoCard.sections.generalInfo.email')} value={student.email} />
              <DetailItem label={translate('selectedStudentInfoCard.sections.generalInfo.school')} value={student.schoolName} />
              <DetailItem label={translate('selectedStudentInfoCard.sections.generalInfo.class')} value={student.class} />
            </dl>
          </div>

          <div>
            <h4 className="text-sm md:text-lg font-semibold text-sky-400 border-b border-sky-500 border-opacity-50 pb-0.5 md:pb-1 mb-1.5 md:mb-2">
              {translate('selectedStudentInfoCard.sections.customerInfo.title')}
            </h4>
            <div className="grid grid-cols-2 gap-x-2 md:gap-x-3">
                <DetailItem label={translate('selectedStudentInfoCard.sections.customerInfo.customerType')} value={doiTuongDisplay} itemClassName={doiTuongClass} />
                <DetailItem label={translate('selectedStudentInfoCard.sections.customerInfo.package')} value={ 
                <span className={`px-1.5 py-0.5 inline-flex text-xs md:text-sm leading-5 font-semibold rounded-full ${
                    student.status === 'Active' || student.status === 'Đang học' ? 'bg-green-800 text-green-200' : 
                    student.status === 'Inactive' || student.status === 'Đã nghỉ' || student.status === 'Hết hạn' ? 'bg-red-800 text-red-200' : 
                    'bg-slate-700 text-slate-300'
                }`}>
                    {student.status || 'N/A'}
                </span>
                } />
            </div>
          </div>

          <div>
            <h4 className="text-sm md:text-lg font-semibold text-sky-400 border-b border-sky-500 border-opacity-50 pb-0.5 md:pb-1 mb-1.5 md:mb-2">
              {translate('selectedStudentInfoCard.sections.otpInfo.title')}
            </h4>
            {isLoadingOtp && <LoadingSpinner text={translate('selectedStudentInfoCard.sections.otpInfo.loading')} size="sm" />}
            {otpError && <p className="text-red-400 text-xs md:text-sm bg-red-900 bg-opacity-30 p-1.5 rounded">{otpError}</p>}
            {otpData && !isLoadingOtp && !otpError && (
              <dl className="grid grid-cols-2 gap-x-2 md:gap-x-3 gap-y-0">
                <DetailItem label={translate('selectedStudentInfoCard.sections.otpInfo.emailOtp')} value={<>{otpData.otpEmail || 'N/A'} <OtpStatusIcon confirmed={otpData.isConfirmOTPEmail} /></>} />
                <DetailItem label={translate('selectedStudentInfoCard.sections.otpInfo.smsOtp')} value={<>{otpData.otpPhoneNumber || 'N/A'} <OtpStatusIcon confirmed={otpData.isConfirmOTPPhoneNumber} /></>} />
              </dl>
            )}
            {!otpData && !isLoadingOtp && !otpError && <p className="text-xs md:text-sm text-slate-500">{translate('selectedStudentInfoCard.sections.otpInfo.noData')}</p>}
          </div>
        </div>
      </div>
      
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={translate('selectedStudentInfoCard.deleteAccountModal.title')}
        footerContent={
          !isDeletingAccount ? (
            <>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-slate-600 text-slate-200 rounded-md hover:bg-slate-500"
              >
                {translate('selectedStudentInfoCard.deleteAccountModal.cancelButton')}
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                disabled={deleteConfirmationInput.trim().toUpperCase() !== translate('selectedStudentInfoCard.deleteAccountModal.confirmationMatchString').toUpperCase()}
                className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-red-700 text-white rounded-md hover:bg-red-600 disabled:opacity-50"
              >
                {translate('selectedStudentInfoCard.deleteAccountModal.confirmButton')}
              </button>
            </>
          ) : null
        }
      >
        <div className="p-4 md:p-5 text-slate-300">
          {isDeletingAccount ? (
            <LoadingSpinner text={translate('selectedStudentInfoCard.deleteAccountModal.deletingProgress')} />
          ) : (
            <>
              <p className="text-base md:text-lg mb-3">
                {translate('selectedStudentInfoCard.deleteAccountModal.confirmation', {
                  fullName: student.fullName,
                  email: student.email,
                  studentCode: student.studentCode
                })}
              </p>
              <p className="text-sm text-yellow-300 bg-yellow-700 bg-opacity-30 p-2 rounded-md border border-yellow-600 mb-4">
                {translate('selectedStudentInfoCard.deleteAccountModal.warning')}
              </p>
              <div className="mb-3">
                <label htmlFor="deleteConfirmInput" className="block text-sm font-medium text-slate-400 mb-1">
                  {translate('selectedStudentInfoCard.deleteAccountModal.inputLabel')}
                </label>
                <input
                  type="text"
                  id="deleteConfirmInput"
                  value={deleteConfirmationInput}
                  onChange={(e) => setDeleteConfirmationInput(e.target.value)}
                  placeholder={translate('selectedStudentInfoCard.deleteAccountModal.inputPlaceholder')}
                  className="block w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500"
                />
              </div>
              {deleteModalError && <p className="text-sm text-red-400 mt-2">{deleteModalError}</p>}
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default SelectedStudentInfoCard;