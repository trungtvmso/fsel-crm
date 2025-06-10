
import React, { useState, useContext } from 'react';
import { Student, ProgressMessage, AppMessage, MessageType, StudentSearchResultItem } from '../types'; // Added StudentSearchResultItem
import Modal from './Modal';
import { resetPlacementTestProcess } from '../services/studentService';
import LoadingSpinner from './LoadingSpinner';
import { LanguageContext } from '../contexts/LanguageContext';
import { AppMessageKey, createAppMessage, DefaultMessageTypes } from '../src/lib/messages'; // Updated import path

interface ResetPlacementTestButtonProps {
  student: Student;
  onUpdateGlobalMessage: (message: AppMessage | null) => void;
  onStudentReset: (newStudentData?: StudentSearchResultItem) => void; // Changed Student to StudentSearchResultItem
  buttonClassName?: string;
  textClassName?: string;
}

const ResetPlacementTestButton: React.FC<ResetPlacementTestButtonProps> = ({
  student,
  onUpdateGlobalMessage,
  onStudentReset,
  buttonClassName = "px-1.5 py-0.5 md:px-2 md:py-1 text-xs md:text-sm bg-orange-500 text-white rounded hover:bg-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-400 focus:ring-offset-1 focus:ring-offset-slate-800 flex-shrink-0",
  textClassName = ""
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteProgress, setDeleteProgress] = useState<ProgressMessage[]>([]);
  const { translate } = useContext(LanguageContext)!;

  const handleDeletePT = async () => {
    setIsDeleting(true);
    setDeleteProgress([]);
    onUpdateGlobalMessage(
      createAppMessage({
        key: AppMessageKey.RESET_PT_STARTING,
        translate,
        replacements: { fullName: student.fullName },
      })
    );

    const progressCallback = (
        step: string, 
        messageKeyOrRawMessage: string, 
        replacements: Record<string, string | number | null | undefined> = {}, 
        isError = false
    ) => {
      let translatedMessage: string;
      // If it's a "PROCESS_FAILED" step, messageKeyOrRawMessage is already the detailed error string.
      // Otherwise, it's a key to be translated.
      if (step === "PROCESS_FAILED") {
        translatedMessage = messageKeyOrRawMessage; // This is already the error message string
      } else {
        translatedMessage = translate(`alertMessage.resetPT.progressMessages.${messageKeyOrRawMessage}`, replacements as Record<string, string>);
      }
      
      setDeleteProgress(prev => [...prev, { step, message: translatedMessage, isError }]);
      
      onUpdateGlobalMessage(
        createAppMessage({
          key: AppMessageKey.RESET_PT_STEP_PROGRESS,
          translate,
          replacements: { step, message: translatedMessage },
          typeOverride: isError ? MessageType.ERROR : DefaultMessageTypes[AppMessageKey.RESET_PT_STEP_PROGRESS],
        })
      );
    };

    const result = await resetPlacementTestProcess(student, progressCallback);

    setIsDeleting(false);

    if (result.success) {
      onUpdateGlobalMessage(
        createAppMessage({
          key: AppMessageKey.RESET_PT_SUCCESS,
          translate,
          replacements: { fullName: student.fullName },
        })
      );
      setIsDeleteModalOpen(false); 
      onStudentReset(result.newStudentData);
    } else {
      onUpdateGlobalMessage(
        createAppMessage({
          key: AppMessageKey.RESET_PT_FAILURE,
          translate,
          replacements: { fullName: student.fullName, message: result.message },
        })
      );
    }
  };
  
  const canResetPT = student.object !== 'Client';

  if (!canResetPT) {
    return null;
  }

  return (
    <>
      <button
        onClick={() => setIsDeleteModalOpen(true)}
        className={buttonClassName}
        disabled={isDeleting}
      >
        <span className={textClassName}>{translate('selectedStudentInfoCard.buttons.resetPT')}</span>
      </button>
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title={translate('selectedStudentInfoCard.resetPT.modal.title', { fullName: student.fullName })}
      >
        <div className="p-4 md:p-5">
          <p className="text-base md:text-lg text-slate-300 mb-4">
            {translate('selectedStudentInfoCard.resetPT.modal.confirmation', { fullName: student.fullName, email: student.email })}
          </p>
          <p className="text-sm md:text-base text-orange-300 bg-orange-700 bg-opacity-30 p-2 rounded-md border border-orange-600 mb-4">
            <strong>{translate('selectedStudentInfoCard.resetPT.modal.warningTitle')}</strong> {translate('selectedStudentInfoCard.resetPT.modal.warningMessage')}
          </p>
          {isDeleting && (
            <div className="mt-4">
              <LoadingSpinner text={translate('selectedStudentInfoCard.resetPT.modal.processing')} />
              <div className="mt-2 max-h-32 overflow-y-auto text-sm md:text-base bg-slate-700 p-2 rounded">
                {deleteProgress.map((p, i) => (
                  <p key={i} className={`font-medium ${p.isError ? 'text-red-400' : 'text-blue-300'}`}>
                    {/* Display the translated message directly from p.message. The "Bước {step}:" prefix is handled by the AppMessage display. */}
                    {/* For the modal, we use the selectedStudentInfoCard.resetPT.modal.stepProgress key which prefixes "Bước {step}:" */}
                     {translate('selectedStudentInfoCard.resetPT.modal.stepProgress', { step: p.step, message: p.message })}
                  </p>
                ))}
              </div>
            </div>
          )}
          {!isDeleting && (
               <div className="mt-6 flex justify-end space-x-3">
                  <button
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-slate-600 text-slate-200 rounded-md hover:bg-slate-500"
                  >
                  {translate('selectedStudentInfoCard.resetPT.modal.buttons.cancel')}
                  </button>
                  <button
                  onClick={handleDeletePT}
                  className="px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base bg-orange-500 text-white rounded-md hover:bg-orange-600"
                  >
                  {translate('selectedStudentInfoCard.resetPT.modal.buttons.confirm')}
                  </button>
              </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default ResetPlacementTestButton;
