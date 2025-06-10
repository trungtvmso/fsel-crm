
import React, { useState, useEffect, useCallback, useContext } from 'react';
import SearchBar from '../components/SearchBar';
import LoadingSpinner from '../components/LoadingSpinner';
import { Student, StudentSearchResultItem, AppMessage, OtpData, PlacementTestData, GeminiAnalysisResult, AddStudentFormData } from '../types';
import { addStudentProcess, mapStudentSearchResultToStudent } from '../services/studentService';
import DesktopStudentList from '../components/DesktopStudentList';
import SelectedStudentInfoCard from '../components/SelectedStudentInfoCard';
import PlacementTestDetails from '../components/PlacementTestDetails';
import { LanguageContext } from '../contexts/LanguageContext';
import { AppMessageKey, createAppMessage } from '../src/lib/messages';
import AddStudentModal from '../components/AddStudentModal';
import FloatingActionButton from '../components/FloatingActionButton';
import { ActiveDetailTab } from '../types'; // Corrected import
import { DEFAULT_SIGNUP_PASSWORD } from '../constants';

interface StudentManagementPageProps {
  isAdminTokenReady: boolean;
  isAppInitializing: boolean;
  globalMessage: AppMessage | null;
  setGlobalMessage: (message: AppMessage | null) => void;
  aiAnalysisCache: Record<string, GeminiAnalysisResult | null>;
  onAiAnalysisComplete: (cacheKey: string, result: GeminiAnalysisResult | null) => void;

  // State from App.tsx (read-only for StudentManagementPage regarding search results)
  students: Student[];
  selectedStudent: Student | null;
  setSelectedStudent: React.Dispatch<React.SetStateAction<Student | null>>; // Still needed for selection logic within page
  lastSearchTerm: string;
  initialSearchDone: boolean;
  isSearching: boolean; // Search loading state from App.tsx
  
  initialStudentIdFromUrl: string | null; // From App.tsx
  setInitialStudentIdFromUrl: React.Dispatch<React.SetStateAction<string | null>>; // From App.tsx

  isLoadingDetails: boolean;
  desktopOtpData: OtpData | null;
  desktopPtData: PlacementTestData | null;
  desktopOtpError: string | null;
  desktopPtError: string | null;
  activeDetailTab: ActiveDetailTab;
  setActiveDetailTab: React.Dispatch<React.SetStateAction<ActiveDetailTab>>;
  
  clearSelectedStudentDetails: () => void;
  fetchSelectedStudentDetails: (student: Student) => Promise<void>;
  onStudentSearchTrigger: (searchTerm: string) => void; // Callback to trigger search in App.tsx
}

const StudentManagementPage: React.FC<StudentManagementPageProps> = (props) => {
  const {
    isAdminTokenReady, isAppInitializing, globalMessage, setGlobalMessage,
    aiAnalysisCache, onAiAnalysisComplete,
    students, // Removed setStudents
    selectedStudent, setSelectedStudent,
    lastSearchTerm, // Removed setLastSearchTerm
    initialSearchDone, // Removed setInitialSearchDone
    isSearching, // Removed setIsSearching
    initialStudentIdFromUrl, setInitialStudentIdFromUrl,
    isLoadingDetails, desktopOtpData, desktopPtData,
    desktopOtpError, desktopPtError,
    activeDetailTab, setActiveDetailTab,
    clearSelectedStudentDetails, fetchSelectedStudentDetails,
    onStudentSearchTrigger // Added this prop
  } = props;

  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const { translate } = useContext(LanguageContext)!;

  // URL Hash Management and Initial Student Selection
  useEffect(() => {
    let isMounted = true;
    const handlePopState = () => {
      if (!isMounted) return;
      const hash = window.location.hash;
      if (hash.startsWith('#student/')) {
        const studentIdFromUrl = hash.substring('#student/'.length);
        const studentFromList = students.find(s => s.id === studentIdFromUrl);
        if (studentFromList) {
          if (selectedStudent?.id !== studentFromList.id) {
            setSelectedStudent(studentFromList);
          }
        } else if (students.length > 0 || initialSearchDone) { 
          setSelectedStudent(null);
          if(window.location.hash !== '#list') window.location.hash = '#list';
        }
      } else {
        setSelectedStudent(null);
      }
    };

    window.addEventListener('popstate', handlePopState);

    const initialHashValue = window.location.hash;
    if (initialHashValue.startsWith('#student/')) {
        const studentId = initialHashValue.substring('#student/'.length);
        if (!selectedStudent || selectedStudent.id !== studentId) { 
             setInitialStudentIdFromUrl(studentId); 
        }
    } else if (initialHashValue && initialHashValue !== '#' && initialHashValue !== '#list') {
        window.location.hash = '#list'; 
    }

    return () => {
      isMounted = false;
      window.removeEventListener('popstate', handlePopState);
    };
  }, [students, selectedStudent, setSelectedStudent, setInitialStudentIdFromUrl, initialSearchDone]);


  useEffect(() => {
    if (initialStudentIdFromUrl && students.length > 0 && isAdminTokenReady) {
        const studentFromList = students.find(s => s.id === initialStudentIdFromUrl);
        if (studentFromList) {
            if (selectedStudent?.id !== studentFromList.id) {
                setSelectedStudent(studentFromList);
            }
        } else {
            setSelectedStudent(null); 
            setGlobalMessage(createAppMessage({ key: AppMessageKey.NO_STUDENTS_FOUND, translate, replacements: { searchTerm: `ID ${initialStudentIdFromUrl}` } }));
            if(window.location.hash !== '#list') window.location.hash = '#list';
        }
        setInitialStudentIdFromUrl(null); 
    }
  }, [initialStudentIdFromUrl, students, isAdminTokenReady, selectedStudent, setSelectedStudent, setInitialStudentIdFromUrl, translate, setGlobalMessage]);


  const handleSelectStudent = useCallback((student: Student) => {
    if (selectedStudent?.id !== student.id) {
        setSelectedStudent(student); 
        window.history.pushState({ studentId: student.id }, student.fullName, `#student/${student.id}`);
    } else {
        if (window.location.hash !== `#student/${student.id}`) {
            window.history.pushState({ studentId: student.id }, student.fullName, `#student/${student.id}`);
        }
    }
    setActiveDetailTab('info'); 
  }, [selectedStudent, setSelectedStudent, setActiveDetailTab]);

  const handleBackToList = () => {
    window.history.back(); 
  };

  const handleStudentReset = useCallback(() => {
    if (props.lastSearchTerm) { 
      props.onStudentSearchTrigger(props.lastSearchTerm);
    } else {
      // If there's no last search term, App.tsx's handleStudentSearch might clear or set to empty.
      // Or, we might want to explicitly tell App.tsx to clear.
      // For now, re-triggering with empty or last search term handles most cases.
      props.onStudentSearchTrigger(''); // Trigger a clear or default state in App.tsx
    }
    setSelectedStudent(null); 
    if (window.location.hash !== '#list' && window.location.hash !== '#') {
        window.location.hash = '#list'; 
    }
  }, [props.lastSearchTerm, props.onStudentSearchTrigger, setSelectedStudent]);

  const handleAddStudentSubmit = async (formData: AddStudentFormData): Promise<{ success: boolean; messageKey?: string; replacements?: Record<string, string>, newStudent?: StudentSearchResultItem, isValidationError?: boolean }> => {
    if (!isAdminTokenReady) {
      setGlobalMessage(createAppMessage({ key: AppMessageKey.ADMIN_NOT_READY_SEARCH, translate }));
      return { success: false, messageKey: AppMessageKey.ADMIN_NOT_READY_SEARCH.toString() as string};
    }

    const result = await addStudentProcess(formData, translate);

    if (result.success && result.newStudent) {
      setGlobalMessage(
        createAppMessage({
          key: AppMessageKey.ADD_STUDENT_SUCCESS,
          translate,
          replacements: { fullName: result.newStudent.fullName, defaultPassword: DEFAULT_SIGNUP_PASSWORD } 
        })
      );
      // Refresh student list by re-triggering the last search or a specific action
      if (props.lastSearchTerm) {
        props.onStudentSearchTrigger(props.lastSearchTerm); 
      } else {
         props.onStudentSearchTrigger(formData.email); // Or search for the new student
      }
      return { success: true, newStudent: result.newStudent };
    } else {
      if (!result.isValidationError && result.messageKey) { 
         setGlobalMessage(
            createAppMessage({
                key: result.messageKey as AppMessageKey, 
                translate,
                replacements: result.replacements
            })
        );
      }
      return { success: false, messageKey: result.messageKey, replacements: result.replacements, newStudent: undefined, isValidationError: result.isValidationError };
    }
  };

  const handleStudentAccountDeleted = useCallback((deletedStudentId: string) => {
    // App.tsx will handle removing student from its list upon successful deletion.
    // This component just needs to deselect.
    setSelectedStudent(null);
    if (window.location.hash !== '#list' && window.location.hash !== '#') {
        window.location.hash = '#list';
    }
     // Optionally, trigger a refresh of the list if needed, e.g. re-run last search
    if (props.lastSearchTerm) {
        props.onStudentSearchTrigger(props.lastSearchTerm);
    } else {
        props.onStudentSearchTrigger(''); // Or trigger an empty search to refresh
    }
  }, [setSelectedStudent, props.lastSearchTerm, props.onStudentSearchTrigger]);
  
  const renderDetailView = () => {
    if (!selectedStudent) return null;

    const commonTabButtonClass = "px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-150 ease-in-out flex-grow text-center focus:outline-none focus:ring-2 focus:ring-indigo-400";
    const activeTabButtonClass = `${commonTabButtonClass} bg-indigo-600 text-white shadow-md`;
    const inactiveTabButtonClass = `${commonTabButtonClass} bg-slate-700 text-slate-300 hover:bg-slate-600`;

    const aiCacheKey = selectedStudent.studentId; 

    const renderMobileContent = () => {
        const contentWrapperClass = "bg-slate-800 border border-slate-600 rounded-md overflow-hidden h-full flex flex-col";
        if (isLoadingDetails && (activeDetailTab === 'info' || activeDetailTab === 'pt') && !desktopOtpData && !desktopPtData) {
            return <div className="flex-grow flex items-center justify-center p-4"><LoadingSpinner text={translate(AppMessageKey.LOADING_DETAILS_SHORT)} /></div>;
        }
        
        switch (activeDetailTab) {
          case 'info':
            return (
              <div className={contentWrapperClass}>
                <SelectedStudentInfoCard
                  student={selectedStudent}
                  otpData={desktopOtpData}
                  isLoadingOtp={isLoadingDetails && !desktopOtpData && !desktopOtpError} 
                  otpError={desktopOtpError}
                  onStudentAccountDeleted={handleStudentAccountDeleted}
                  onUpdateGlobalMessage={setGlobalMessage}
                />
              </div>
            );
          case 'pt':
            return (
              <div className={contentWrapperClass}>
                <PlacementTestDetails
                  student={selectedStudent}
                  placementTestData={desktopPtData}
                  isLoading={isLoadingDetails && !desktopPtData && !desktopPtError} 
                  error={desktopPtError}
                  viewMode="ptOnly"
                  cachedAiResult={null} 
                  onAiAnalysisComplete={() => {}} 
                  studentIdForCache={aiCacheKey}
                  onUpdateGlobalMessage={setGlobalMessage}
                  onStudentReset={handleStudentReset}
                />
              </div>
            );
          case 'ai':
            return (
              <div className={contentWrapperClass}>
                <PlacementTestDetails
                  student={selectedStudent}
                  placementTestData={desktopPtData} 
                  isLoading={isLoadingDetails && !desktopPtData && !desktopPtError && !aiAnalysisCache[aiCacheKey]} 
                  error={desktopPtError} 
                  viewMode="aiOnly"
                  cachedAiResult={aiAnalysisCache[aiCacheKey] !== undefined ? aiAnalysisCache[aiCacheKey] : null}
                  onAiAnalysisComplete={onAiAnalysisComplete}
                  studentIdForCache={aiCacheKey}
                  onUpdateGlobalMessage={setGlobalMessage}
                  onStudentReset={handleStudentReset}
                />
              </div>
            );
          default:
            return null;
        }
      };

    return (
        <div className="bg-slate-800 shadow-xl rounded-lg flex-grow overflow-hidden border border-slate-700 flex flex-col">
            <div className="p-2 md:p-3 border-b border-slate-700 flex-shrink-0">
                <button
                    onClick={handleBackToList}
                    className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-800 text-sm md:text-base flex items-center"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    {translate('app.backToResults')}
                </button>
            </div>

            <div className="sticky top-0 z-20 bg-slate-800/95 backdrop-blur-sm p-2 lg:hidden flex justify-around items-center border-b border-slate-700 space-x-2 flex-shrink-0">
              <button
                onClick={() => setActiveDetailTab('info')}
                className={activeDetailTab === 'info' ? activeTabButtonClass : inactiveTabButtonClass}
                aria-pressed={activeDetailTab === 'info'}
              >
                {translate('modal.studentDetail.tabs.info')}
              </button>
              <button
                onClick={() => setActiveDetailTab('pt')}
                className={activeDetailTab === 'pt' ? activeTabButtonClass : inactiveTabButtonClass}
                aria-pressed={activeDetailTab === 'pt'}
              >
                {translate('modal.studentDetail.tabs.pt')}
              </button>
              <button
                onClick={() => setActiveDetailTab('ai')}
                className={activeDetailTab === 'ai' ? activeTabButtonClass : inactiveTabButtonClass}
                aria-pressed={activeDetailTab === 'ai'}
              >
                {translate('modal.studentDetail.tabs.ai')}
              </button>
            </div>

            <div className="p-2 md:p-3 flex-grow overflow-y-auto">
                <div className="lg:hidden h-full">
                    {renderMobileContent()}
                </div>

                <div className="hidden lg:flex flex-row gap-2 md:gap-3 h-full">
                     {isLoadingDetails && (!desktopOtpData && !desktopPtData) ? ( 
                        <div className="flex-grow flex items-center justify-center p-4 w-full">
                            <LoadingSpinner text={translate(AppMessageKey.LOADING_DETAILS_SHORT)} />
                        </div>
                    ) : (
                        <>
                            <div className="lg:w-1/4 h-full flex flex-col bg-slate-800 border border-slate-600 rounded-md overflow-hidden">
                                <SelectedStudentInfoCard
                                student={selectedStudent}
                                otpData={desktopOtpData}
                                isLoadingOtp={isLoadingDetails && !desktopOtpData && !desktopOtpError}
                                otpError={desktopOtpError}
                                onStudentAccountDeleted={handleStudentAccountDeleted}
                                onUpdateGlobalMessage={setGlobalMessage}
                                />
                            </div>
                            <div className="lg:w-1/4 h-full flex flex-col bg-slate-800 border border-slate-600 rounded-md overflow-hidden">
                                <PlacementTestDetails
                                student={selectedStudent}
                                placementTestData={desktopPtData}
                                isLoading={isLoadingDetails && !desktopPtData && !desktopPtError}
                                error={desktopPtError}
                                viewMode="ptOnly"
                                cachedAiResult={null}
                                onAiAnalysisComplete={() => {}}
                                studentIdForCache={aiCacheKey}
                                onUpdateGlobalMessage={setGlobalMessage}
                                onStudentReset={handleStudentReset}
                                />
                            </div>
                            <div className="lg:w-1/2 h-full flex flex-col bg-slate-800 border border-slate-600 rounded-md overflow-hidden">
                                <PlacementTestDetails
                                student={selectedStudent}
                                placementTestData={desktopPtData} 
                                isLoading={isLoadingDetails && !desktopPtData && !desktopPtError && !aiAnalysisCache[aiCacheKey]} 
                                error={desktopPtError} 
                                viewMode="aiOnly"
                                cachedAiResult={aiAnalysisCache[aiCacheKey] !== undefined ? aiAnalysisCache[aiCacheKey] : null}
                                onAiAnalysisComplete={onAiAnalysisComplete}
                                studentIdForCache={aiCacheKey}
                                onUpdateGlobalMessage={setGlobalMessage}
                                onStudentReset={handleStudentReset}
                                />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* SearchBar is now in Layout.tsx for studentManagement view */}
      {/* This local SearchBar is removed to avoid duplication if Layout provides it */}
      {/* 
      <div className="p-3 bg-slate-800 shadow-md rounded-lg mb-3 md:mb-4">
        <SearchBar
          onSearch={props.onStudentSearchTrigger} 
          isLoading={isAppInitializing || props.isSearching} 
          direction="column" 
        />
      </div> 
      */}
      
      {selectedStudent ? (
        renderDetailView()
      ) : (
        <div className="flex flex-col space-y-3 md:space-y-4 w-full flex-grow overflow-hidden">
            <div className="bg-slate-800 shadow-xl rounded-lg flex-grow overflow-hidden border border-slate-700">
                <DesktopStudentList
                students={students}
                onSelectStudent={handleSelectStudent}
                selectedStudentId={selectedStudent?.id || null}
                isLoading={props.isSearching} // Use loading state from App
                initialSearchDone={initialSearchDone}
                />
            </div>
        </div>
      )}

      {!isAppInitializing && isAdminTokenReady && (
        <FloatingActionButton
          onClick={() => setIsAddStudentModalOpen(true)}
          disabled={!isAdminTokenReady} 
          title={translate('app.addStudentButton')}
        />
      )}

      <AddStudentModal
        isOpen={isAddStudentModalOpen}
        onClose={() => setIsAddStudentModalOpen(false)}
        onSubmit={handleAddStudentSubmit}
      />
    </div>
  );
};

export default StudentManagementPage;
