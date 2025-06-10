
import React, { useState, useEffect, useCallback, useContext } from 'react';
import { Student, AppMessage, MessageType, OtpData, PlacementTestData, GeminiAnalysisResult, StudentSearchResultItem, StudentSearchResult, FselApiResponse, ActiveDetailTab } from './types';
import { ensureAdminToken } from './services/authService';
import { getOtpForStudent, getPlacementTestResults, mapStudentSearchResultToStudent, searchStudents } from './services/studentService'; 
import { LanguageContext } from './contexts/LanguageContext';
import LanguageSwitcher from './components/LanguageSwitcher';
import { AppMessageKey, createAppMessage, DefaultMessageTypes } from './src/lib/messages';
import { AlertSettingsContext } from './contexts/AlertSettingsContext';
import AlertMessage from './components/AlertMessage';
import Layout from './components/Layout';
import StudentManagementPage from './pages/StudentManagementPage';
import CourseInformationPage from './pages/CourseInformationPage';
import AlertSettingsPage from './pages/AlertSettingsPage'; 
import ProductPackagesPage from './pages/ProductPackagesPage'; // Import ProductPackagesPage
import LoadingSpinner from './components/LoadingSpinner';
import { extractApiErrorMessage, isValidEmail, isValidPhoneNumber } from './utils';


export type ActiveView = 'studentManagement' | 'courseInformation' | 'alertSettings' | 'productPackages'; // Added 'productPackages'

const App: React.FC = () => {
  const [isAppInitializing, setIsAppInitializing] = useState(true);
  const [isAdminTokenReady, setIsAdminTokenReady] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<AppMessage | null>(null);
  const [activeView, setActiveView] = useState<ActiveView>('studentManagement');
  
  // Student Management State
  const [isSearching, setIsSearching] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [lastSearchTerm, setLastSearchTerm] = useState<string>('');
  const [initialSearchDone, setInitialSearchDone] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [initialStudentIdFromUrl, setInitialStudentIdFromUrl] = useState<string | null>(null);

  // Details State (for selected student)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [desktopOtpData, setDesktopOtpData] = useState<OtpData | null>(null);
  const [desktopPtData, setDesktopPtData] = useState<PlacementTestData | null>(null);
  const [desktopOtpError, setDesktopOtpError] = useState<string | null>(null);
  const [desktopPtError, setDesktopPtError] = useState<string | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<ActiveDetailTab>('info');


  // AI Analysis Cache
  const [aiAnalysisCache, setAiAnalysisCache] = useState<Record<string, GeminiAnalysisResult | null>>({});

  const { translate } = useContext(LanguageContext)!;
  const alertSettingsContext = useContext(AlertSettingsContext);

  // Initialize Admin Token
  useEffect(() => {
    let isMounted = true;
    const initAuth = async () => {
      if (isMounted) setIsAppInitializing(true);
      if (isMounted) setCurrentMessage(createAppMessage({ key: AppMessageKey.INITIALIZING_ADMIN, translate }));
      try {
        const token = await ensureAdminToken();
        if (isMounted) {
          if (token) {
            setIsAdminTokenReady(true);
            setCurrentMessage(createAppMessage({ key: AppMessageKey.ADMIN_READY, translate }));
          } else {
            setIsAdminTokenReady(false);
            setCurrentMessage(createAppMessage({ key: AppMessageKey.ADMIN_INIT_FAILED_CRITICAL, translate }));
          }
        }
      } catch (error: any) {
        if (isMounted) {
          setIsAdminTokenReady(false);
          setCurrentMessage(createAppMessage({ key: AppMessageKey.ADMIN_INIT_ERROR, translate, replacements: { message: error.message } }));
        }
      } finally {
        if (isMounted) setIsAppInitializing(false);
      }
    };
    initAuth();
    return () => { isMounted = false; };
  }, [translate]);

  const clearDesktopDetailsState = useCallback(() => {
    setDesktopOtpData(null);
    setDesktopPtData(null);
    setDesktopOtpError(null);
    setDesktopPtError(null);
  }, []);

  const fetchSelectedStudentDetails = useCallback(async (studentToFetch: Student) => {
    if (!studentToFetch) return;
    const studentIdForThisFetch = studentToFetch.id;
    
    setIsLoadingDetails(true);
    clearDesktopDetailsState(); 

    if (studentToFetch.id) {
      try {
        const otpResponse = await getOtpForStudent(studentToFetch.id);
        if (selectedStudent?.id === studentIdForThisFetch) { 
          if (otpResponse.isOK && otpResponse.result) setDesktopOtpData(otpResponse.result);
          else setDesktopOtpError(extractApiErrorMessage(otpResponse, translate('apiErrors.otpError')));
        }
      } catch (e: any) {
        if (selectedStudent?.id === studentIdForThisFetch) setDesktopOtpError(extractApiErrorMessage(e, translate('apiErrors.otpError')));
      }
    } else {
      if (selectedStudent?.id === studentIdForThisFetch) setDesktopOtpError(translate('apiErrors.missingUserIdError'));
    }

    if (studentToFetch.studentId) {
      try {
        const ptResponse = await getPlacementTestResults(studentToFetch.studentId);
        if (selectedStudent?.id === studentIdForThisFetch) {
          if (ptResponse.isOK && ptResponse.result) setDesktopPtData(ptResponse.result);
          else setDesktopPtError(extractApiErrorMessage(ptResponse, translate('apiErrors.ptError')));
        }
      } catch (e: any) {
        if (selectedStudent?.id === studentIdForThisFetch) setDesktopPtError(extractApiErrorMessage(e, translate('apiErrors.ptError')));
      }
    } else {
      if (selectedStudent?.id === studentIdForThisFetch) setDesktopPtError(translate('apiErrors.missingStudentEntityIdError'));
    }
    if (selectedStudent?.id === studentIdForThisFetch) setIsLoadingDetails(false);
  }, [selectedStudent, translate, clearDesktopDetailsState]); // selectedStudent dependency is important here

  useEffect(() => {
    if (selectedStudent) {
      fetchSelectedStudentDetails(selectedStudent);
    } else {
      clearDesktopDetailsState();
      setIsLoadingDetails(false);
    }
  }, [selectedStudent, fetchSelectedStudentDetails, clearDesktopDetailsState]);


  const handleStudentSearch = useCallback(async (searchTerm: string) => {
    setSelectedStudent(null); 
    if (window.location.hash !== '#list' && window.location.hash !== '#') {
        window.location.hash = '#list'; 
    }
    
    if (!isAdminTokenReady) {
      setCurrentMessage(createAppMessage({ key: AppMessageKey.ADMIN_NOT_READY_SEARCH, translate }));
      setIsSearching(false); 
      setInitialSearchDone(true); 
      setStudents([]); 
      return;
    }
    if (!searchTerm.trim()) {
      // If search term is empty, clear results and don't show "term required" if we want to allow clearing.
      // If empty search means "show all", that's a different logic. For now, clear.
      setStudents([]);
      setLastSearchTerm('');
      setInitialSearchDone(true);
      setIsSearching(false);
      // setCurrentMessage(createAppMessage({ key: AppMessageKey.SEARCH_TERM_REQUIRED, translate })); // Optional: only show if explicitly empty submit
      return;
    }
    if (!isValidPhoneNumber(searchTerm) && !isValidEmail(searchTerm)) {
      setCurrentMessage(createAppMessage({ key: AppMessageKey.INVALID_SEARCH_FORMAT, translate }));
      setStudents([]);
      setIsSearching(false);
      setInitialSearchDone(true);
      return;
    }

    setIsSearching(true);
    setCurrentMessage(createAppMessage({ key: AppMessageKey.SEARCHING, translate, replacements: { searchTerm } }));
    setLastSearchTerm(searchTerm);
    setInitialSearchDone(false); 

    try {
      const response: FselApiResponse<StudentSearchResult> = await searchStudents(searchTerm);
      if (response.isOK && response.result) {
        const mappedStudents: Student[] = response.result.items
          .filter((item: StudentSearchResultItem) => !item.isDeleted)
          .map(mapStudentSearchResultToStudent);
        setStudents(mappedStudents);
        setInitialSearchDone(true);

        if (mappedStudents.length > 0) {
          setCurrentMessage(
            createAppMessage({
              key: AppMessageKey.STUDENTS_FOUND,
              translate,
              replacements: { count: String(mappedStudents.length), searchTerm }
            })
          );
          if (initialStudentIdFromUrl) {
            const studentFromList = mappedStudents.find(s => s.id === initialStudentIdFromUrl);
            if (studentFromList) {
                setSelectedStudent(studentFromList); 
            } else {
                setCurrentMessage(createAppMessage({ key: AppMessageKey.NO_STUDENTS_FOUND, translate, replacements: { searchTerm: `ID ${initialStudentIdFromUrl}` } }));
                if(window.location.hash !== '#list') window.location.hash = '#list';
            }
            setInitialStudentIdFromUrl(null); 
          }

        } else {
          setCurrentMessage(createAppMessage({ key: AppMessageKey.NO_STUDENTS_FOUND, translate, replacements: { searchTerm } }));
        }
      } else {
        setStudents([]);
        setInitialSearchDone(true);
        setCurrentMessage(
          createAppMessage({
            key: AppMessageKey.SEARCH_FAILED,
            translate,
            replacements: { message: extractApiErrorMessage(response, translate('apiErrors.default')) }
          })
        );
      }
    } catch (error: any) {
      setStudents([]);
      setInitialSearchDone(true);
      setCurrentMessage(createAppMessage({ key: AppMessageKey.SEARCH_FAILED, translate, replacements: { message: error.message } }));
    } finally {
      setIsSearching(false);
    }
  }, [isAdminTokenReady, translate, initialStudentIdFromUrl, setInitialStudentIdFromUrl, setCurrentMessage, setStudents, setSelectedStudent, setIsSearching, setLastSearchTerm, setInitialSearchDone]);


  const handleAiAnalysisComplete = useCallback((cacheKey: string, result: GeminiAnalysisResult | null) => {
    setAiAnalysisCache(prev => ({ ...prev, [cacheKey]: result }));
  }, []);

  const getAlertContainerClasses = (): string => {
    let base = "fixed z-[100] p-2 md:p-4 w-full md:w-auto max-w-md";
    const position = alertSettingsContext?.settings?.position || 'top-right';

    switch (position) {
      case 'top-left': return `${base} top-4 left-4`;
      case 'top-center': return `${base} top-4 left-1/2 -translate-x-1/2`;
      case 'top-right': return `${base} top-4 right-4`;
      case 'bottom-left': return `${base} bottom-4 left-4`;
      case 'bottom-center': return `${base} bottom-4 left-1/2 -translate-x-1/2`;
      case 'bottom-right': return `${base} bottom-4 right-4`;
      default: return `${base} top-4 right-4`;
    }
  };
  
  if (isAppInitializing && !isAdminTokenReady) {
    return (
      <div className="min-h-screen bg-slate-900 text-slate-200 flex flex-col items-center justify-center">
        <LoadingSpinner text={translate(AppMessageKey.INITIALIZING_ADMIN)} size="lg" />
         <div className={getAlertContainerClasses()}>
            <AlertMessage message={currentMessage} onDismiss={() => setCurrentMessage(null)} />
        </div>
      </div>
    );
  }

  // Props for StudentManagementPage, ensuring it matches the refactored component's expectations
  const studentManagementProps = {
    isAdminTokenReady,
    isAppInitializing,
    globalMessage: currentMessage,
    setGlobalMessage: setCurrentMessage,
    aiAnalysisCache,
    onAiAnalysisComplete: handleAiAnalysisComplete,
    
    // Search related state (read-only for StudentManagementPage)
    students,
    lastSearchTerm,
    initialSearchDone,
    isSearching,
    
    // Selection state and setters (StudentManagementPage handles selection within its view)
    selectedStudent,
    setSelectedStudent,
    
    initialStudentIdFromUrl, 
    setInitialStudentIdFromUrl, // StudentManagementPage might use this to signal App

    // Details state (read-only for StudentManagementPage, fetched by App)
    isLoadingDetails,
    desktopOtpData,
    desktopPtData,
    desktopOtpError,
    desktopPtError,
    activeDetailTab,
    setActiveDetailTab,
    
    // Callbacks
    clearSelectedStudentDetails: clearDesktopDetailsState, 
    fetchSelectedStudentDetails,
    onStudentSearchTrigger: handleStudentSearch, // The primary way StudentManagementPage triggers a search
  };


  return (
    <Layout 
      activeView={activeView} 
      setActiveView={setActiveView}
      onSearchHeader={activeView === 'studentManagement' ? handleStudentSearch : undefined} // Pass search handler only for student view
      isSearchingHeader={isSearching}
      lastSearchTermHeader={lastSearchTerm}
    >
      {activeView === 'studentManagement' && (
        // Pass the refined props
        <StudentManagementPage {...studentManagementProps} />
      )}
      {activeView === 'courseInformation' && (
        <CourseInformationPage 
            setGlobalMessage={setCurrentMessage}
        />
      )}
      {activeView === 'alertSettings' && ( 
        <AlertSettingsPage setGlobalMessage={setCurrentMessage} />
      )}
      {activeView === 'productPackages' && ( 
        <ProductPackagesPage setGlobalMessage={setCurrentMessage} />
      )}
      <div className={getAlertContainerClasses()}>
        <AlertMessage message={currentMessage} onDismiss={() => setCurrentMessage(null)} />
      </div>
    </Layout>
  );
};

export default App;