
import React, { useState, useCallback, useEffect, useContext } from 'react';
import { Student, PlacementTestData, GeminiAnalysisResult, SkillScore, AppMessage, StudentSearchResultItem } from '../types';
import { streamDetailedAnalysis, streamTelemarketingScripts, isGeminiConfigured } from '../services/geminiService';
import LoadingSpinner from './LoadingSpinner';
import { formatGeminiOutputToHtml } from '../utils';
import { LanguageContext } from '../contexts/LanguageContext';
import ResetPlacementTestButton from './ResetPlacementTestButton';

interface PlacementTestDetailsProps {
  student: Student;
  placementTestData: PlacementTestData | null;
  isLoading: boolean; 
  error: string | null; 
  viewMode?: 'full' | 'ptOnly' | 'aiOnly';

  cachedAiResult?: GeminiAnalysisResult | null;
  onAiAnalysisComplete?: (studentId: string, result: GeminiAnalysisResult | null) => void; 
  studentIdForCache: string; // student.studentId, used as key for cache

  onUpdateGlobalMessage: (message: AppMessage | null) => void;
  onStudentReset: (newStudentData?: StudentSearchResultItem) => void;
}

const CONTENT_TOGGLE_THRESHOLD = 250; 

const PlacementTestDetails: React.FC<PlacementTestDetailsProps> = ({ 
    student,
    placementTestData, 
    isLoading: isLoadingPt, // Renamed to avoid conflict
    error: ptError, // Renamed
    viewMode = 'full',
    cachedAiResult,
    onAiAnalysisComplete,
    studentIdForCache,
    onUpdateGlobalMessage,
    onStudentReset
}) => {
  const [analysisText, setAnalysisText] = useState<string>('');
  const [scriptsText, setScriptsText] = useState<string>('');
  
  const [isAnalysisLoading, setIsAnalysisLoading] = useState(false);
  const [isScriptsLoading, setIsScriptsLoading] = useState(false);
  
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [scriptsError, setScriptsError] = useState<string | null>(null);
  
  const [isAnalysisExpanded, setIsAnalysisExpanded] = useState(false);
  const [isScriptsExpanded, setIsScriptsExpanded] = useState(false);

  const { translate, language } = useContext(LanguageContext)!; 

  useEffect(() => {
    if (cachedAiResult) { 
        setAnalysisText(cachedAiResult.analysis || '');
        setScriptsText(cachedAiResult.telemarketingScripts || '');
        setAnalysisError(null); 
        setScriptsError(null);
    } else {
        setAnalysisText(''); 
        setScriptsText('');
        setAnalysisError(null);
        setScriptsError(null);
    }
    setIsAnalysisLoading(false);
    setIsScriptsLoading(false);
    setIsAnalysisExpanded(false);
    setIsScriptsExpanded(false);
  }, [studentIdForCache, cachedAiResult]);


  const handleRunAnalysis = useCallback(async () => {
    if (!placementTestData && viewMode !== 'ptOnly') { 
        setAnalysisError(translate('placementTestDetails.ai.errors.noPtData'));
        return;
    }
    if (!isGeminiConfigured()) {
        setAnalysisError(translate('placementTestDetails.ai.errors.notConfigured'));
        return;
    }

    setIsAnalysisLoading(true);
    setAnalysisText(''); // Clear previous analysis
    setScriptsText(''); // Also clear scripts as they depend on analysis
    setAnalysisError(null);
    setScriptsError(null); // Clear script error too
    setIsAnalysisExpanded(false); 
    setIsScriptsExpanded(false); 
    
    let currentStreamedAnalysis = "";

    try {
      await streamDetailedAnalysis(placementTestData!, { 
        onChunk: (chunk) => {
          currentStreamedAnalysis += chunk;
          setAnalysisText(prev => prev + chunk);
        },
        onError: (errorMessage) => {
          setAnalysisError(translate('placementTestDetails.ai.errors.analysisError', { message: errorMessage }));
          setIsAnalysisLoading(false);
          if (onAiAnalysisComplete) { // Report failure to cache
            onAiAnalysisComplete(studentIdForCache, { analysis: '', telemarketingScripts: '' });
          }
        },
        onComplete: (fullText) => {
          setIsAnalysisLoading(false);
          if (!analysisError) { // If no error was set during streaming by onError
             setAnalysisText(fullText); // Ensure final text is set
             if (onAiAnalysisComplete) {
                onAiAnalysisComplete(studentIdForCache, { analysis: fullText, telemarketingScripts: '' }); // Update cache
             }
          }
        }
      });
    } catch (e: any) { // Catch any unexpected errors from the service call itself
      setAnalysisError(e.message || translate('placementTestDetails.ai.errors.generalFailure'));
      setIsAnalysisLoading(false);
      if (onAiAnalysisComplete) {
         onAiAnalysisComplete(studentIdForCache, { analysis: '', telemarketingScripts: '' });
      }
    }
  }, [placementTestData, onAiAnalysisComplete, studentIdForCache, translate, language, viewMode]);

  const handleRunScripts = useCallback(async () => {
    if (!analysisText) {
        setScriptsError(translate('placementTestDetails.ai.errors.noAnalysisForScripts'));
        return;
    }
    if (!placementTestData && viewMode !== 'ptOnly') {
        setScriptsError(translate('placementTestDetails.ai.errors.noPtDataForScripts'));
        return;
    }
     if (!isGeminiConfigured()) {
        setScriptsError(translate('placementTestDetails.ai.errors.notConfigured'));
        return;
    }

    setIsScriptsLoading(true);
    setScriptsText(''); // Clear previous scripts
    setScriptsError(null);
    setIsScriptsExpanded(false);

    let currentStreamedScripts = "";

    try {
        await streamTelemarketingScripts(analysisText, placementTestData!, {
            onChunk: (chunk) => {
                currentStreamedScripts += chunk;
                setScriptsText(prev => prev + chunk);
            },
            onError: (errorMessage) => {
                setScriptsError(translate('placementTestDetails.ai.errors.scriptError', { message: errorMessage }));
                setIsScriptsLoading(false);
                if (onAiAnalysisComplete) { // Report failure to cache
                     onAiAnalysisComplete(studentIdForCache, { analysis: analysisText, telemarketingScripts: '' });
                }
            },
            onComplete: (fullText) => {
                setIsScriptsLoading(false);
                if(!scriptsError) {
                    setScriptsText(fullText);
                    if (onAiAnalysisComplete) {
                        onAiAnalysisComplete(studentIdForCache, { analysis: analysisText, telemarketingScripts: fullText });
                    }
                }
            }
        });
    } catch (e: any) {
        setScriptsError(e.message || translate('placementTestDetails.ai.errors.generalFailure'));
        setIsScriptsLoading(false);
        if (onAiAnalysisComplete) {
           onAiAnalysisComplete(studentIdForCache, { analysis: analysisText, telemarketingScripts: '' });
        }
    }
  }, [analysisText, placementTestData, onAiAnalysisComplete, studentIdForCache, translate, language, viewMode]);


  const renderPtContent = () => {
    if (isLoadingPt) return <div className="text-center py-2"><LoadingSpinner text={translate('placementTestDetails.pt.loading')} size="sm" /></div>;
    if (ptError) return <p className="text-red-400 text-center py-2 md:py-3 bg-red-900 bg-opacity-30 p-1.5 md:p-2 rounded-md text-xs md:text-sm">{ptError}</p>;
    if (!placementTestData) return <p className="text-slate-400 text-center py-2 md:py-3 bg-slate-700 p-1.5 md:p-2 rounded-md text-xs md:text-sm">{translate('placementTestDetails.pt.noData')}</p>;
    
    const { courseName, currentLevel, recommendedLevel, placementTestResults } = placementTestData;
    
    const SKILL_ORDER = ['Listening', 'Reading', 'Vocabulary', 'Grammar']; 

    return (
        <div className={viewMode === 'full' ? "mt-0" : "mt-1 md:mt-1.5"}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1.5 md:gap-2 mb-1.5 md:mb-2 text-xs md:text-sm p-1.5 md:p-2 bg-slate-750 rounded shadow">
                <p><strong className="text-slate-400">{translate('placementTestDetails.pt.course')}:</strong> {courseName || 'N/A'}</p>
                <p><strong className="text-slate-400">{translate('placementTestDetails.pt.currentLevel')}:</strong> {currentLevel || 'N/A'}</p>
                <p><strong className="text-slate-400">{translate('placementTestDetails.pt.recommendedLevel')}:</strong> {recommendedLevel || 'N/A'}</p>
            </div>

            {placementTestResults && placementTestResults.length > 0 ? (
                placementTestResults.map((testResult, index) => {
                    const sortedSkillScores = [...(testResult.skillScores || [])].sort((a, b) => {
                        const indexA = SKILL_ORDER.indexOf(a.skill);
                        const indexB = SKILL_ORDER.indexOf(b.skill);
                        if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                        if (indexA !== -1) return -1;
                        if (indexB !== -1) return 1;
                        return a.skill.localeCompare(b.skill);
                    });

                    return (
                        <div key={index} className="mb-1.5 md:mb-2 p-1.5 md:p-2 rounded"> 
                            <h4 className="font-semibold text-slate-300 text-sm md:text-base">
                            {translate('placementTestDetails.pt.testTitle', { 
                                level: testResult.level || 'N/A', 
                                correctCount: String(testResult.correctCount), 
                                totalCount: String(testResult.correctTotal) 
                            })}
                            </h4>
                            {sortedSkillScores && sortedSkillScores.length > 0 ? (
                            <div className="overflow-x-auto mt-1 md:mt-1.5">
                                <table className="min-w-full text-xs md:text-sm divide-y divide-slate-600">
                                <thead className="bg-slate-700">
                                    <tr>
                                    <th className="px-1 py-0.5 md:px-1.5 md:py-1 text-left font-medium text-slate-400 uppercase tracking-wider">{translate('placementTestDetails.pt.table.skill')}</th>
                                    <th className="px-1 py-0.5 md:px-1.5 md:py-1 text-left font-medium text-slate-400 uppercase tracking-wider">{translate('placementTestDetails.pt.table.score')}</th>
                                    <th className="px-1 py-0.5 md:px-1.5 md:py-1 text-left font-medium text-slate-400 uppercase tracking-wider">{translate('placementTestDetails.pt.table.correctTotal')}</th>
                                    <th className="px-1 py-0.5 md:px-1.5 md:py-1 text-left font-medium text-slate-400 uppercase tracking-wider">{translate('placementTestDetails.pt.table.percentage')}</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-slate-750 divide-y divide-slate-600 text-slate-300">
                                    {sortedSkillScores.map((skill: SkillScore, skillIdx: number) => (
                                    <tr key={skillIdx} className={skillIdx % 2 === 0 ? 'bg-slate-750' : 'bg-slate-700'}>
                                        <td className="px-1 py-0.5 md:px-1.5 md:py-1 whitespace-nowrap">{skill.skill}</td>
                                        <td className="px-1 py-0.5 md:px-1.5 md:py-1 whitespace-nowrap">{skill.scores}</td>
                                        <td className="px-1 py-0.5 md:px-1.5 md:py-1 whitespace-nowrap">{skill.correctCount}/{skill.totalCount}</td>
                                        <td className="px-1 py-0.5 md:px-1.5 md:py-1 whitespace-nowrap">{skill.percent}%</td>
                                    </tr>
                                    ))}
                                </tbody>
                                </table>
                            </div>
                            ) : <p className="text-xs md:text-sm text-slate-500 mt-1">{translate('placementTestDetails.pt.noSkillDetails')}</p>}
                        </div>
                    );
                })
            ) : <p className="text-center text-slate-500 py-1.5 md:py-2 text-xs md:text-sm">{translate('placementTestDetails.pt.noTestDetails')}</p>}
        </div>
    );
  }

  const renderAiContent = () => {
    if (!isGeminiConfigured()) {
        if (viewMode === 'aiOnly' || viewMode === 'full') {
             return <p className="text-orange-400 text-center mt-1.5 md:mt-2 text-xs md:text-sm bg-orange-900 bg-opacity-40 p-1.5 md:p-2 rounded-md">{translate('placementTestDetails.ai.notConfiguredWarning')}</p>;
        }
        return null;
    }

    if (!placementTestData && !isAnalysisLoading && !isScriptsLoading && viewMode !== 'ptOnly') { 
        if (viewMode === 'aiOnly' || viewMode === 'full') {
            return <p className="text-slate-400 text-center mt-1.5 md:mt-2 text-xs md:text-sm bg-slate-700 p-1.5 md:p-2 rounded-md">{translate('placementTestDetails.ai.needPtData')}</p>;
        }
        return null;
    }
    
    const AnalysisContentBlock = () => (
        <div className="relative">
            {isAnalysisLoading && !analysisText && <p className="text-xs md:text-sm text-slate-400 py-1">{translate('placementTestDetails.ai.loadingAnalysis')}</p>}
            {analysisText ? (
                <>
                    <div
                        className={`prose prose-sm md:prose-base max-w-none text-slate-300 
                        ${analysisText.length > CONTENT_TOGGLE_THRESHOLD && !isAnalysisExpanded ? 'max-h-[10rem] md:max-h-[12rem] overflow-hidden' : ''}`}
                        dangerouslySetInnerHTML={{ __html: formatGeminiOutputToHtml(analysisText) }}
                    />
                    {analysisText.length > CONTENT_TOGGLE_THRESHOLD && !isAnalysisExpanded &&
                        <div className="absolute bottom-0 left-0 right-0 h-5 md:h-6 bg-gradient-to-t from-slate-750 via-slate-750 to-transparent pointer-events-none"></div>
                    }
                </>
            ) : (
                !isAnalysisLoading && <p className="text-slate-400 text-xs md:text-sm py-1.5">{translate('placementTestDetails.ai.noAnalysisData')}</p>
            )}
        </div>
    );

    const ScriptsContentBlock = () => (
        <div className="relative">
            {isScriptsLoading && !scriptsText && <p className="text-xs md:text-sm text-slate-400 py-1">{translate('placementTestDetails.ai.loadingScripts')}</p>}
            {scriptsText ? (
                 <>
                    <div
                        className={`prose prose-sm md:prose-base max-w-none text-slate-300 
                        ${scriptsText.length > CONTENT_TOGGLE_THRESHOLD && !isScriptsExpanded ? 'max-h-[10rem] md:max-h-[12rem] overflow-hidden' : ''}`}
                        dangerouslySetInnerHTML={{ __html: formatGeminiOutputToHtml(scriptsText) }}
                    />
                     {scriptsText.length > CONTENT_TOGGLE_THRESHOLD && !isScriptsExpanded &&
                        <div className="absolute bottom-0 left-0 right-0 h-5 md:h-6 bg-gradient-to-t from-slate-750 via-slate-750 to-transparent pointer-events-none"></div>
                    }
                </>
            ) : (
                 !isScriptsLoading && <p className="text-slate-400 text-xs md:text-sm py-1.5">{translate('placementTestDetails.ai.noScriptData')}</p>
            )}
        </div>
    );

    const analysisButtonText = analysisText ? translate('placementTestDetails.buttons.analyzeAI.reanalyzeDetail') : translate('placementTestDetails.buttons.analyzeAI.analyzeDetail');
    const scriptsButtonText = scriptsText ? translate('placementTestDetails.buttons.analyzeAI.regenerateScripts') : translate('placementTestDetails.buttons.analyzeAI.generateScripts');
    const commonButtonClass = "px-1.5 py-0.5 md:px-2 md:py-1 text-white rounded shadow hover:from-purple-700 hover:to-indigo-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:ring-offset-1 focus:ring-offset-slate-800 disabled:opacity-60 text-xs md:text-sm font-medium transition-all duration-150 ease-in-out flex-shrink-0 flex items-center justify-center";

    return (
        <div className={viewMode === 'full' ? "mt-0" : "mt-1 md:mt-1.5"}>
            <div className="mt-1 bg-slate-750 shadow-xl rounded-lg">
                 <div className="p-1.5 md:p-2 space-y-1.5 md:space-y-2 text-slate-300">
                    <div className="bg-slate-750 p-0 rounded-lg"> 
                        <div className="flex justify-between items-center mb-1 md:mb-1.5 pb-0.5 border-b border-indigo-500 border-opacity-50">
                            <h5 className="text-sm md:text-lg font-semibold text-indigo-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                <span>{translate('placementTestDetails.ai.detailedAnalysisTitle')}</span>
                            </h5>
                            <div className="flex items-center space-x-2">
                                {analysisText.length > CONTENT_TOGGLE_THRESHOLD && (
                                    <button
                                        onClick={() => setIsAnalysisExpanded(!isAnalysisExpanded)}
                                        className="text-indigo-400 hover:text-indigo-300 text-xs md:text-sm py-0.5 px-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors flex items-center flex-shrink-0"
                                        aria-expanded={isAnalysisExpanded}
                                        aria-controls="ai-analysis-content"
                                    >
                                        {isAnalysisExpanded ? (
                                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>{translate('buttons.collapse')}</>
                                        ) : (
                                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>{translate('buttons.expand')}</>
                                        )}
                                    </button>
                                )}
                                {isGeminiConfigured() && (placementTestData || viewMode === 'aiOnly') && (
                                    <button
                                        onClick={handleRunAnalysis}
                                        disabled={isAnalysisLoading || isScriptsLoading || (!placementTestData && viewMode !== 'aiOnly')}
                                        className={`${commonButtonClass} bg-gradient-to-r from-indigo-600 to-blue-500`}
                                        aria-live="polite"
                                    >
                                        {isAnalysisLoading ? (
                                            <>
                                                <svg className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 md:h-4 md:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                                {translate('placementTestDetails.buttons.analyzeAI.loadingAnalysis')}
                                            </>
                                        ) : analysisButtonText}
                                    </button>
                                )}
                            </div>
                        </div>
                        <style>
                            {`
                            .gemini-content-block { background-color: #334155; padding: 0.5rem 0.75rem; border-radius: 0.375rem; box-shadow: 0 1px 2px 0 rgba(0,0,0,0.1); margin-bottom: 0.5rem; }
                            .gemini-content-block h2 { color: #a5b4fc; border-bottom: 1px solid #6366f1; padding-bottom: 0.25rem; font-weight: 600; margin-bottom: 0.5rem; font-size: 1.2em; text-transform: uppercase; }
                            .gemini-content-block h3 { color: #cbd5e1; font-weight: 600; margin-bottom: 0.25rem; font-size: 1.1em; text-transform: uppercase; }
                            .gemini-content-block p { color: #d1d5db; margin-bottom: 0.25rem; }
                            .gemini-content-block ul { list-style-position: inside; margin-left: 0.1rem; color: #d1d5db; }
                            .gemini-content-block li { margin-bottom: 0.1rem; }
                            .gemini-section-separator { border-top-width: 1px; border-color: #4b5563; margin-top: 0.75rem; margin-bottom: 0.75rem; }
                            .prose .gemini-content-block:first-child > h2:first-child, .prose .gemini-content-block:first-child > h3:first-child { margin-top:0; }
                            `}
                        </style>
                        <div id="ai-analysis-content">
                             <AnalysisContentBlock />
                        </div>
                        {analysisError && <p className="text-red-400 text-center mt-1 bg-red-900 bg-opacity-30 p-1.5 rounded-md text-xs md:text-sm whitespace-pre-line">{analysisError}</p>}
                    </div>

                    <div className="bg-slate-750 p-0 rounded-lg"> 
                        <div className="flex justify-between items-center mb-1 md:mb-1.5 pb-0.5 border-b border-purple-500 border-opacity-50">
                            <h5 className="text-sm md:text-lg font-semibold text-purple-400 flex items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 md:h-5 md:w-5 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.46 4.383c.24.72-.054 1.503-.722 1.928l-1.04 1.04M15 21a2 2 0 01-2-2v-3.28a1 1 0 01.684-.948l4.383-1.46c.72-.24 1.503.054 1.928.722l1.04 1.04M3 5l7.106 7.106M15 21L7.894 13.894" /></svg>
                                <span>{translate('placementTestDetails.ai.scriptSuggestionsTitle')}</span>
                            </h5>
                            <div className="flex items-center space-x-2">
                                {scriptsText.length > CONTENT_TOGGLE_THRESHOLD && (
                                    <button
                                        onClick={() => setIsScriptsExpanded(!isScriptsExpanded)}
                                        className="text-purple-400 hover:text-purple-300 text-xs md:text-sm py-0.5 px-1 rounded bg-slate-700 hover:bg-slate-600 transition-colors flex items-center flex-shrink-0"
                                        aria-expanded={isScriptsExpanded}
                                        aria-controls="ai-scripts-content"
                                    >
                                        {isScriptsExpanded ? (
                                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" /></svg>{translate('buttons.collapse')}</>
                                        ) : (
                                            <><svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 md:h-3.5 md:w-3.5 inline mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" /></svg>{translate('buttons.expand')}</>
                                        )}
                                    </button>
                                )}
                                {isGeminiConfigured() && (placementTestData || viewMode === 'aiOnly') && (
                                    <button
                                        onClick={handleRunScripts}
                                        disabled={!analysisText || isAnalysisLoading || isScriptsLoading || (!placementTestData && viewMode !== 'aiOnly')}
                                        className={`${commonButtonClass} bg-gradient-to-r from-purple-600 to-pink-500`}
                                        aria-live="polite"
                                    >
                                        {isScriptsLoading ? (
                                            <>
                                            <svg className="animate-spin -ml-0.5 mr-1 h-3.5 w-3.5 md:h-4 md:w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                            {translate('placementTestDetails.buttons.analyzeAI.loadingScripts')}
                                            </>
                                        ) : scriptsButtonText}
                                    </button>
                                )}
                            </div>
                        </div>
                        <div id="ai-scripts-content">
                            <ScriptsContentBlock />
                        </div>
                         {scriptsError && <p className="text-red-400 text-center mt-1 bg-red-900 bg-opacity-30 p-1.5 rounded-md text-xs md:text-sm whitespace-pre-line">{scriptsError}</p>}
                    </div>
                </div>
            </div>
        </div>
    );
  }
  
  const showPtHeader = viewMode !== 'aiOnly';
  const showAiHeader = viewMode !== 'ptOnly';

  return (
    <div className="bg-slate-800 rounded-lg h-full flex flex-col text-slate-300">
      {showPtHeader && ( 
        <div className="h-10 md:h-12 flex items-center justify-between px-2 md:px-3 bg-gradient-to-r from-indigo-600 to-blue-500 rounded-t-lg flex-shrink-0">
          <h3 className="text-base md:text-xl font-semibold text-white flex items-center truncate flex-grow">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 mr-1.5 flex-shrink-0">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            <span className="truncate mr-2" title={translate('placementTestDetails.headers.ptResults')}>{translate('placementTestDetails.headers.ptResults')}</span>
          </h3>
          {(viewMode === 'ptOnly' || viewMode === 'full') && student && (
            <ResetPlacementTestButton 
              student={student}
              onUpdateGlobalMessage={onUpdateGlobalMessage}
              onStudentReset={onStudentReset}
            />
          )}
        </div>
      )}
      
      {/* This top-level AI header is removed as buttons are now inline with section titles */}
      {/* {showAiHeader && (
        <div className={`h-10 md:h-12 flex justify-between items-center px-2 md:px-3 bg-gradient-to-r from-purple-600 to-pink-500 ${!showPtHeader ? 'rounded-t-lg' : ''} flex-shrink-0`}>
            <h3 className="text-base md:text-xl font-semibold text-white flex items-center flex-grow truncate">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4 md:w-5 md:h-5 mr-1.5 flex-shrink-0">
                 <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.355a7.5 7.5 0 01-4.5 0m4.5 0v-.375c0-.621-.504-1.125-1.125-1.125h-1.5c-.621 0-1.125.504-1.125 1.125v.375m7.5-3.75V15A2.25 2.25 0 0013.5 12.75h-1.5A2.25 2.25 0 0010.5 15v1.5m0 0V18m0 0a2.25 2.25 0 002.25 2.25h1.5A2.25 2.25 0 0016.5 18V16.5m-6 0a2.25 2.25 0 00-2.25-2.25h-1.5A2.25 2.25 0 004.5 16.5V18m0 0V19.5a2.25 2.25 0 002.25 2.25h1.5a2.25 2.25 0 002.25-2.25V18m-6 0h1.5m6 0h1.5" />
              </svg>
              <span className="truncate mr-2" title={translate('placementTestDetails.headers.aiAnalysis')}>{translate('placementTestDetails.headers.aiAnalysis')}</span>
            </h3>
        </div>
      )} */}

      <div className="p-2 md:p-3 flex-grow overflow-y-auto">
        {viewMode !== 'aiOnly' && renderPtContent()}
        {viewMode === 'full' && <hr className="my-2 md:my-3 border-slate-700" />}
        {viewMode !== 'ptOnly' && renderAiContent()}
      </div>
    </div>
  );
};

export default PlacementTestDetails;
