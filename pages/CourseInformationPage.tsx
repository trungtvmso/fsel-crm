import React, { useState, useEffect, useContext } from 'react';
import { 
    Course, CourseCategory, AppMessage, KnowledgeSkillsSummary, 
    LessonPlanJsonObject, TableCell, TableRow, 
    EnglishFoundationRawCourse, 
    EnglishFoundationNewFormatCourse, 
    EFTongQuan_Generic, EFChiTiet, EFUnit, EFLesson, EFUnitLearningObjectives,
    PedagogicalFeature, EFOutputObjectiveDetail, EFCourseStructureDuration, EFKnowledgeOutput,
    RawEFTableRow, 
    RawEFTableCell,
    EFProfessionalExpertAssessment,
    EFSixComponentAssessment,
    EFSwotAnalysis,
    EFLessonStageChecklistStep // Keep this for EFGeneralLessonStructure
} from '../types';
import { LanguageContext } from '../contexts/LanguageContext';
import LoadingSpinner from '../components/LoadingSpinner';
import { AppMessageKey, createAppMessage } from '../src/lib/messages';

interface CourseInformationPageProps {
  setGlobalMessage: (message: AppMessage | null) => void;
}

type ActiveCourseTab = 'overview' | 'lessonPlan' | 'expertAssessment';

const transformNewEFDataToCourse = (
  rawData: EnglishFoundationNewFormatCourse, 
  baseCourseInfo: Partial<Course>
): Course => {
  const courseName = rawData.tong_quan_ve_khoa_hoc.course_name || baseCourseInfo.course_name || "Unknown EF Course";
  const tongQuanRaw = rawData.tong_quan_ve_khoa_hoc;

  const efTongQuan: EFTongQuan_Generic = {
    course_name: tongQuanRaw.course_name,
    level_CEFR: tongQuanRaw.level_CEFR,
    level_name: tongQuanRaw.level_name,
    doi_tuong_muc_tieu: tongQuanRaw.doi_tuong_muc_tieu,
    muc_tieu_dau_ra_chung: tongQuanRaw.muc_tieu_dau_ra_chung_khoa_hoc as EFOutputObjectiveDetail,
    so_luong_hoa_dau_ra_kien_thuc_du_kien: tongQuanRaw.so_luong_hoa_dau_ra_kien_thuc_du_kien as EFKnowledgeOutput,
    cau_truc_va_thoi_luong_khoa_hoc: tongQuanRaw.cau_truc_va_thoi_luong_khoa_hoc as EFCourseStructureDuration,
    danh_gia_tong_the_va_ket_luan: tongQuanRaw.danh_gia_tong_the_va_ket_luan,
    professional_expert_assessment: tongQuanRaw.danh_gia_tong_the_va_ket_luan?.professional_expert_assessment 
  };

  const efChiTiet: EFChiTiet = rawData.chi_tiet_ve_khoa_hoc;
  
  let totalLessons = 0;
  try {
    if (efTongQuan.cau_truc_va_thoi_luong_khoa_hoc) {
        const units = efTongQuan.cau_truc_va_thoi_luong_khoa_hoc.total_units_count || efTongQuan.cau_truc_va_thoi_luong_khoa_hoc.tong_so_units || 0;
        let lessonsPer = 0;
        if (efTongQuan.cau_truc_va_thoi_luong_khoa_hoc.typical_lessons_per_unit) {
            const match = String(efTongQuan.cau_truc_va_thoi_luong_khoa_hoc.typical_lessons_per_unit).match(/\d+/);
            if (match) lessonsPer = parseInt(match[0], 10);
        } else if (efTongQuan.cau_truc_va_thoi_luong_khoa_hoc.so_lessons_moi_unit) {
            lessonsPer = efTongQuan.cau_truc_va_thoi_luong_khoa_hoc.so_lessons_moi_unit;
        }
        totalLessons = units * lessonsPer;
    }
  } catch(e) {
    console.error("Error calculating total lessons for new EF format:", e);
  }


  return {
    ...baseCourseInfo,
    id: baseCourseInfo.id || String(Date.now()), // Ensure ID
    course_name: courseName,
    ef_course_type: 'new_format',
    ef_tong_quan: efTongQuan,
    ef_chi_tiet: efChiTiet,
    total_lessons: totalLessons || baseCourseInfo.total_lessons, // Use calculated if available
    lesson_plan_html: undefined, // Clear old HTML if any
    target_audience: undefined,
    output_level: undefined,
    core_objectives: undefined,
    key_pedagogical_features: undefined,
    knowledge_skills_summary: undefined,
  };
};


const transformOldEFDataToCourse = (
  rawData: EnglishFoundationRawCourse,
  baseCourseInfo: Partial<Course>
): Course => {
  let lessonPlan: LessonPlanJsonObject | undefined = undefined;
  if (rawData.lesson_plan_html && typeof rawData.lesson_plan_html === 'object' && 'tableRows' in rawData.lesson_plan_html) {
    const rawTableRows = rawData.lesson_plan_html.tableRows as RawEFTableRow[];
    const transformedTableRows: TableRow[] = rawTableRows.map(rawRow => 
      rawRow.map((rawCell: RawEFTableCell, colIndex: number) => ({
        Content: rawCell.Content,
        OrderCol: colIndex,
        OrderRow: 0, 
        Unit: rawCell.Unit
      }))
    );
    lessonPlan = { tableRows: transformedTableRows };
  }

  return {
    ...baseCourseInfo,
    id: baseCourseInfo.id || String(Date.now()),
    course_name: rawData.course_name || baseCourseInfo.course_name || "Unknown EF Course",
    target_audience: rawData.target_audience,
    output_level: rawData.output_level,
    core_objectives: rawData.core_objectives,
    course_duration_weeks: rawData.course_duration_weeks,
    course_duration_months: rawData.course_duration_months,
    lessons_per_week: rawData.lessons_per_week,
    lesson_duration_hours: rawData.lesson_duration_hours,
    total_lessons: rawData.total_lessons,
    number_of_unit_tests: rawData.number_of_unit_tests,
    number_of_final_tests: rawData.number_of_final_tests,
    overall_goal: rawData.overall_goal,
    knowledge_skills_summary: rawData.knowledge_skills_summary,
    lesson_plan_html: lessonPlan,
    key_pedagogical_features: rawData.key_pedagogical_features,
    ef_course_type: 'old_format',
    ef_tong_quan: undefined, 
    ef_chi_tiet: undefined, 
  };
};


const CourseInformationPage: React.FC<CourseInformationPageProps> = ({ setGlobalMessage }) => {
  const [categories, setCategories] = useState<CourseCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [isLoadingCourse, setIsLoadingCourse] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveCourseTab>('overview');
  const [efUnitFilter, setEfUnitFilter] = useState<string>('all');

  const { translate, language } = useContext(LanguageContext)!;

  const courseDataFiles: Record<string, Record<string, string>> = {
    Aca: {
      a1: 'lessionPlan/Aca/a1.json',
      a2: 'lessionPlan/Aca/a2.json',
      b1: 'lessionPlan/Aca/b1.json',
      b1plus: 'lessionPlan/Aca/b1plus.json',
      b2: 'lessionPlan/Aca/b2.json',
      c1: 'lessionPlan/Aca/c1.json',
    },
    IeltsPathway: {
      ielts50: 'lessionPlan/IeltsPathway/ielts50.json',
      ielts60: 'lessionPlan/IeltsPathway/ielts60.json',
      ielts70: 'lessionPlan/IeltsPathway/ielts70.json',
    },
    EnglishFoundation: {
      ef_a1: 'lessionPlan/EnglishFoundation/a1.json',
      ef_a2: 'lessionPlan/EnglishFoundation/a2.json',
      ef_b1: 'lessionPlan/EnglishFoundation/b1.json',
    }
  };

  useEffect(() => {
    const loadCategories = () => {
      setIsLoadingCategories(true);
      const staticCategories: CourseCategory[] = [
        { 
          id: 'aca', 
          name: translate('courseInformation.categories.academic'), 
          path: 'Aca',
          courses: [
            { id: 'a1', course_name: 'A1', description: translate('courseInformation.courses.a1.description') },
            { id: 'a2', course_name: 'A2', description: translate('courseInformation.courses.a2.description') },
            { id: 'b1', course_name: 'B1', description: translate('courseInformation.courses.b1.description') },
            { id: 'b1plus', course_name: 'B1+', description: translate('courseInformation.courses.b1plus.description') },
            { id: 'b2', course_name: 'B2', description: translate('courseInformation.courses.b2.description') },
            { id: 'c1', course_name: 'C1', description: translate('courseInformation.courses.c1.description') },
          ]
        },
        { 
          id: 'ielts', 
          name: translate('courseInformation.categories.ieltsPathway'), 
          path: 'IeltsPathway',
          courses: [
            { id: 'ielts50', course_name: translate('courseInformation.courses.ielts50.name'), description: translate('courseInformation.courses.ielts50.description') },
            { id: 'ielts60', course_name: translate('courseInformation.courses.ielts60.name'), description: translate('courseInformation.courses.ielts60.description') },
            { id: 'ielts70', course_name: translate('courseInformation.courses.ielts70.name'), description: translate('courseInformation.courses.ielts70.description') },
          ]
        },
        { 
          id: 'ef', 
          name: translate('courseInformation.categories.englishFoundation'), 
          path: 'EnglishFoundation',
          courses: [
            { id: 'ef_a1', course_name: translate('courseInformation.courses.ef_a1.name'), description: translate('courseInformation.courses.ef_a1.description') },
            { id: 'ef_a2', course_name: translate('courseInformation.courses.ef_a2.name'), description: translate('courseInformation.courses.ef_a2.description') },
            { id: 'ef_b1', course_name: translate('courseInformation.courses.ef_b1.name'), description: translate('courseInformation.courses.ef_b1.description') },
          ]
        }
      ];
      setCategories(staticCategories);
      setIsLoadingCategories(false);
    };
    loadCategories();
  }, [translate, language]);

  const handleSelectCourse = async (courseId: string, categoryPath: string, courseName: string) => {
    setIsLoadingCourse(true);
    setSelectedCourse(null); 
    setGlobalMessage(null);
    setActiveTab('overview'); 

    const filePath = courseDataFiles[categoryPath]?.[courseId];
    if (!filePath) {
        setGlobalMessage(createAppMessage({ 
            key: AppMessageKey.COURSE_LOAD_FAILED, 
            translate,
            replacements: { courseName, error: "File path not found for course." }
        }));
        setIsLoadingCourse(false);
        return;
    }
    
    try {
        const response = await fetch(filePath);
        if (!response.ok) {
            throw new Error(translate('courseInformation.errors.fetchFailed', { courseName, status: String(response.status) }));
        }
        const rawData: any = await response.json();

        const baseCourseInfo: Partial<Course> = {
            id: courseId,
            course_name: courseName,
            fileName: filePath
        };

        let courseData: Course;
        
        if (rawData.tong_quan_ve_khoa_hoc && rawData.chi_tiet_ve_khoa_hoc) {
          try {
            courseData = transformNewEFDataToCourse(rawData as EnglishFoundationNewFormatCourse, baseCourseInfo);
          } catch (transformError: any) {
             console.error(`Failed to transform ${courseName} (Category: ${categoryPath}) as New EF Format:`, transformError);
             if (categoryPath === 'EnglishFoundation' && rawData.target_audience && rawData.core_objectives) {
                 courseData = transformOldEFDataToCourse(rawData as EnglishFoundationRawCourse, baseCourseInfo);
             } else { 
                 throw new Error(translate('courseInformation.errors.invalidFormat', { courseName }));
             }
          }
        } else if (categoryPath === 'EnglishFoundation' && rawData.target_audience && rawData.core_objectives) {
            courseData = transformOldEFDataToCourse(rawData as EnglishFoundationRawCourse, baseCourseInfo);
        } else {
            console.warn(`Course ${courseName} in category ${categoryPath} does not match any recognized detailed structure.`);
            throw new Error(translate('courseInformation.errors.invalidFormat', { courseName }));
        }

        setSelectedCourse(courseData);

    } catch (error: any) {
        console.error("Error loading or processing course data:", error);
        setGlobalMessage(createAppMessage({ 
            key: AppMessageKey.COURSE_LOAD_FAILED, 
            translate,
            replacements: { courseName, error: error.message || translate('courseInformation.errors.unknownError') }
        }));
    } finally {
        setIsLoadingCourse(false);
    }
  };
  
  const handleBack = () => {
    if (selectedCourse) {
      setSelectedCourse(null);
      setActiveTab('overview');
      setEfUnitFilter('all');
    } else if (selectedCategory) {
      setSelectedCategory(null);
    }
  };

  const renderSection = (titleKey: string, content: React.ReactNode, titleColor = "text-sky-400", borderColor = "border-sky-500") => (
    <div className="mb-3 md:mb-4 p-3 bg-slate-800 shadow-lg rounded-lg border border-slate-700">
      <h4 className={`text-base md:text-lg font-semibold ${titleColor} border-b ${borderColor} border-opacity-50 pb-1 mb-2`}>
        {translate(titleKey)}
      </h4>
      {content}
    </div>
  );
  
  const renderList = (items: string[] | undefined, itemClassName: string = "text-slate-300 text-sm md:text-base") => {
    if (!Array.isArray(items) || items.length === 0) return <p className="text-slate-500 text-xs md:text-sm">{translate('common.noData') || 'N/A'}</p>;
    return (
      <ul className="list-disc list-inside space-y-0.5 md:space-y-1">
        {items.map((item, index) => (
          <li key={index} className={itemClassName}>{item}</li>
        ))}
      </ul>
    );
  };

 const renderDetailItem = (
    labelKey: string,
    value?: string | number | null | string[] | EFLessonStageChecklistStep[] | React.ReactNode,
    className?: string,
    valueClassName: string = "text-slate-300"
  ) => {
    let displayValue: React.ReactNode;
  
    if (value === undefined || value === null) {
      displayValue = <span className="text-slate-500 italic">{translate('common.na') || 'N/A'}</span>;
    } else if (Array.isArray(value)) {
      if (value.length === 0) {
         displayValue = <span className="text-slate-500 italic">{translate('common.noData') || 'N/A'}</span>;
      } 
      else if (value.every(item => typeof item === 'string')) {
        displayValue = renderList(value as string[]);
      } 
      else if (value.every(item => 
          typeof item === 'object' && 
          item !== null && 
          'buoc' in item && 
          typeof (item as any).buoc === 'string' &&
          'muc_dich' in item &&
          typeof (item as any).muc_dich === 'string'
      )) {
         displayValue = (
          <ul className="list-disc list-inside space-y-0.5 text-slate-300">
            {(value as EFLessonStageChecklistStep[]).map((step: EFLessonStageChecklistStep, idx: number) => (
              <li key={idx}><strong>{step.buoc}:</strong> {step.muc_dich}</li>
            ))}
          </ul>
        );
      }
      else if (value.every(item => React.isValidElement(item))) {
        displayValue = <>{value}</>; 
      }
      else {
        displayValue = value.map(v => {
             if (typeof v === 'object' && v !== null && !React.isValidElement(v)) return JSON.stringify(v);
             return String(v);
        }).join(', ');
      }
    } else if (typeof value === 'object' && React.isValidElement(value)) { 
        displayValue = value;
    }
     else {
      displayValue = String(value);
    }
  
    return (
      <div className={`py-0.5 md:py-1 ${className || ''}`}>
        <dt className="text-xs md:text-sm font-medium text-slate-400">{translate(labelKey)}</dt>
        <dd className={`mt-0 text-sm md:text-base ${valueClassName}`}>{displayValue}</dd>
      </div>
    );
  };
  
  const renderSwotAnalysis = (swot?: EFSwotAnalysis) => {
    if (!swot) return renderDetailItem('courseInformation.efFields.swotAnalysisTitle', translate('common.noData'));
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {renderDetailItem('courseInformation.efFields.swotStrengths', swot.strengths)}
            {renderDetailItem('courseInformation.efFields.swotWeaknesses', swot.weaknesses)}
            {renderDetailItem('courseInformation.efFields.swotOpportunities', swot.opportunities)}
            {renderDetailItem('courseInformation.efFields.swotThreats', swot.threats)}
        </div>
    );
  };

  const renderSixComponentAssessment = (assessment?: EFSixComponentAssessment) => {
    if (!assessment) return renderDetailItem('courseInformation.efFields.evaluationBasedOnSixComponentsTitle', translate('common.noData'));
    return (
        <div className="space-y-2 text-sm md:text-base">
            {renderDetailItem('courseInformation.efFields.listeningAssessment', assessment.listening_assessment)}
            {renderDetailItem('courseInformation.efFields.speakingAssessment', assessment.speaking_assessment)}
            {renderDetailItem('courseInformation.efFields.readingAssessment', assessment.reading_assessment)}
            {renderDetailItem('courseInformation.efFields.writingAssessment', assessment.writing_assessment)}
            {renderDetailItem('courseInformation.efFields.vocabularyAssessment', assessment.vocabulary_assessment)}
            {renderDetailItem('courseInformation.efFields.grammarAssessmentOverall', assessment.grammar_assessment)}
        </div>
    );
  };
  
  const renderEFNewOverview = (tongQuan: EFTongQuan_Generic, chiTiet: EFChiTiet) => {
    const showExpertAssessmentTab = selectedCourse?.ef_course_type === 'new_format' && !!selectedCourse.ef_tong_quan?.professional_expert_assessment;
    return (
      <div className="space-y-3">
        {renderSection('courseInformation.efFields.generalCourseInfoTitle', 
          <div className="grid grid-cols-1 md:grid-cols-[auto,1fr] text-sm md:text-base">
            {/* Column 1 */}
            <div className="space-y-2 md:pr-4 md:border-r md:border-slate-700">
              {renderDetailItem('courseInformation.efFields.levelName', 
                `${tongQuan.level_name || ''} (${tongQuan.level_CEFR || translate('common.na')})`
              )}
              {renderDetailItem('courseInformation.efFields.age', tongQuan.doi_tuong_muc_tieu?.do_tuoi)}
            </div>
            {/* Column 2 */}
            <div className="space-y-2 md:pl-4">
              <div>
                <h5 className="text-sm font-semibold text-slate-300 mt-2 mb-1">{translate('courseInformation.efFields.courseStructureDurationTitle')}</h5>
                <div className="space-y-1 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  {renderDetailItem('courseInformation.efFields.totalUnits', tongQuan.cau_truc_va_thoi_luong_khoa_hoc?.total_units_count ?? tongQuan.cau_truc_va_thoi_luong_khoa_hoc?.tong_so_units)}
                  {renderDetailItem('courseInformation.efFields.lessonsPerUnit', tongQuan.cau_truc_va_thoi_luong_khoa_hoc?.typical_lessons_per_unit ?? tongQuan.cau_truc_va_thoi_luong_khoa_hoc?.so_lessons_moi_unit)}
                  {renderDetailItem('courseInformation.courseDetails.lessonDurationHours', tongQuan.cau_truc_va_thoi_luong_khoa_hoc?.estimated_hours_per_lesson)}
                  {renderDetailItem('courseInformation.efFields.totalTime', tongQuan.cau_truc_va_thoi_luong_khoa_hoc?.total_estimated_learning_hours ?? tongQuan.cau_truc_va_thoi_luong_khoa_hoc?.tong_thoi_gian_hoc_va_kiem_tra)}
                </div>
              </div>

              <div className="mt-2">
                <h5 className="text-sm font-semibold text-slate-300 mt-3 mb-1">{translate('courseInformation.efFields.targetAudienceTitle')}</h5>
                <div className="space-y-1">
                  {renderDetailItem('courseInformation.efFields.entryLevel', tongQuan.doi_tuong_muc_tieu?.trinh_do_dau_vao)}
                  {renderDetailItem('courseInformation.efFields.commonReasons', tongQuan.doi_tuong_muc_tieu?.ly_do_hoc_tap_pho_bien)}
                </div>
              </div>
            </div>
          </div>
        )}
        
        {tongQuan.muc_tieu_dau_ra_chung && renderSection('courseInformation.efFields.overallOutputObjectivesTitle',
          <div className="space-y-1 text-sm md:text-base">
            {renderDetailItem('courseInformation.efFields.generalDescription', tongQuan.muc_tieu_dau_ra_chung.mo_ta_chung)}
            {renderDetailItem('courseInformation.efFields.detailedSkills', tongQuan.muc_tieu_dau_ra_chung.chi_tiet_ky_nang)}
          </div>
        )}

        {tongQuan.so_luong_hoa_dau_ra_kien_thuc_du_kien && renderSection('courseInformation.efFields.expectedKnowledgeOutputTitle',
          <div className="space-y-1 text-sm md:text-base">
            {renderDetailItem('courseInformation.efFields.vocabulary', tongQuan.so_luong_hoa_dau_ra_kien_thuc_du_kien.total_estimated_new_vocabulary)}
            {renderDetailItem('courseInformation.efFields.tensesStructuresCount', tongQuan.so_luong_hoa_dau_ra_kien_thuc_du_kien.total_tenses_learned)}
            {renderDetailItem('courseInformation.efFields.coreGrammar', tongQuan.so_luong_hoa_dau_ra_kien_thuc_du_kien.total_core_grammar_patterns)}
            {renderDetailItem('courseInformation.efFields.realWorldSituations', tongQuan.so_luong_hoa_dau_ra_kien_thuc_du_kien.total_real_world_situations)}
          </div>
        )}
        
        {tongQuan.danh_gia_tong_the_va_ket_luan && 
          (!showExpertAssessmentTab || !tongQuan.professional_expert_assessment) && 
          renderSection('courseInformation.efFields.overallAssessmentConclusionTitle',
            <div className="space-y-1 text-sm md:text-base">
              {renderDetailItem('courseInformation.efFields.curriculumStrengths', tongQuan.danh_gia_tong_the_va_ket_luan?.diem_manh_lo_trinh)}
              {renderDetailItem('courseInformation.efFields.suitability', tongQuan.danh_gia_tong_the_va_ket_luan?.su_phu_hop_voi_muc_tieu_khoa_hoc)}
              {renderDetailItem('courseInformation.efFields.preparationHigherLevels', tongQuan.danh_gia_tong_the_va_ket_luan?.su_chuan_bi_for_higher_levels)}
            </div>
          )
        }
        
        {chiTiet?.lesson_structure_and_objectives && renderSection('courseInformation.efFields.generalLessonStructureTitle', 
          <div className="space-y-1 text-sm md:text-base">
            {renderDetailItem('courseInformation.efFields.checklistRole', chiTiet.lesson_structure_and_objectives.vai_tro_lesson_stage_checklist)}
            {renderDetailItem('courseInformation.efFields.checklistSteps', chiTiet.lesson_structure_and_objectives.checklist_steps_description)}
          </div>
        )}

        {chiTiet?.teaching_methodology_and_tools && renderSection('courseInformation.efFields.teachingMethodsToolsTitle',
          <div className="space-y-2 text-sm md:text-base">
            {renderDetailItem('courseInformation.efFields.blendedLearning', chiTiet.teaching_methodology_and_tools.blended_learning_approach)}
            {chiTiet.teaching_methodology_and_tools.assessment_and_reinforcement &&
              renderDetailItem('courseInformation.efFields.assessmentToolsRole', 
                `${chiTiet.teaching_methodology_and_tools.assessment_and_reinforcement.homework_workbook}; 
                 ${chiTiet.teaching_methodology_and_tools.assessment_and_reinforcement.progress_test}; 
                 ${chiTiet.teaching_methodology_and_tools.assessment_and_reinforcement.reading_writing_portfolio}`
              )
            }
            {chiTiet.teaching_methodology_and_tools.digital_tools_integration &&
              renderDetailItem('courseInformation.efFields.supplementaryElements', 
                `${chiTiet.teaching_methodology_and_tools.digital_tools_integration.bai_giang_video_tuong_tac}; 
                 ${chiTiet.teaching_methodology_and_tools.digital_tools_integration.dien_dan_lop_hoc_cung_AI}`
              )
            }
            {Array.isArray(chiTiet.teaching_methodology_and_tools.personalization_features) && chiTiet.teaching_methodology_and_tools.personalization_features.length > 0 &&
              renderDetailItem('courseInformation.efFields.personalizationFeatures', chiTiet.teaching_methodology_and_tools.personalization_features)
            }
          </div>
        )}
      </div>
    );
  };
  
  const renderExpertAssessmentTabContent = () => {
    if (!selectedCourse || selectedCourse.ef_course_type !== 'new_format' || !selectedCourse.ef_tong_quan?.professional_expert_assessment) {
      return <p className="text-slate-400 p-3">{translate('common.noData')}</p>;
    }
    const assessmentData = selectedCourse.ef_tong_quan.professional_expert_assessment;
    return (
      <div className="space-y-3">
        {renderSection('courseInformation.efFields.evaluationBasedOnSixComponentsTitle', renderSixComponentAssessment(assessmentData.evaluation_based_on_six_components), "text-teal-400", "border-teal-500")}
        {renderSection('courseInformation.efFields.swotAnalysisTitle', renderSwotAnalysis(assessmentData.swot_analysis), "text-amber-400", "border-amber-500")}
      </div>
    );
  };

  const renderOldTableFromJson = (lessonPlan: LessonPlanJsonObject | RawEFTableRow[]) => {
    let tableRows: TableRow[];

    if (Array.isArray(lessonPlan)) { 
        tableRows = lessonPlan.map(rawRow => 
            rawRow.map((rawCell, colIndex) => ({
                Content: rawCell.Content,
                OrderCol: colIndex,
                OrderRow: 0, 
                Unit: rawCell.Unit
            }))
        );
    } else if (lessonPlan && 'tableRows' in lessonPlan) { 
        tableRows = lessonPlan.tableRows;
    } else {
        return <p className="text-slate-400">{translate('courseInformation.lessonPlan.noData')}</p>;
    }
    
    if (!tableRows || tableRows.length === 0) {
      return <p className="text-slate-400">{translate('courseInformation.lessonPlan.noData')}</p>;
    }
    
    const units = Array.from(new Set(tableRows.flat().map(cell => cell.Unit).filter(Boolean)));
    const filteredRows = efUnitFilter === 'all' 
      ? tableRows 
      : tableRows.filter(row => row.some(cell => cell.Unit === efUnitFilter));

    return (
      <div className="space-y-3">
        <div className="mb-3">
          <label htmlFor="efUnitFilter" className="block text-sm font-medium text-slate-300 mb-1">{translate('courseInformation.lessonPlan.filterByUnitLabel')}</label>
          <select
            id="efUnitFilter"
            value={efUnitFilter}
            onChange={(e) => setEfUnitFilter(e.target.value)}
            className="block w-full md:w-1/3 bg-slate-700 border border-slate-600 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-200 text-sm"
          >
            <option value="all">{translate('courseInformation.lessonPlan.allUnitsLabel')}</option>
            {units.map(unit => (
              <option key={unit} value={unit}>{unit}</option>
            ))}
          </select>
        </div>

        <div className="overflow-x-auto bg-slate-800 shadow-md rounded-lg border border-slate-700">
          <table className="min-w-full divide-y divide-slate-600">
            <thead className="bg-slate-700">
              <tr>
                {tableRows[0]?.map((cell, index) => (
                  <th key={index} scope="col" className="px-3 py-2 text-left text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    {cell.Content} 
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {filteredRows.slice(1).map((row, rowIndex) => ( 
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-slate-800' : 'bg-slate-750'}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="px-3 py-2 whitespace-pre-wrap text-sm text-slate-300 align-top" dangerouslySetInnerHTML={{ __html: cell.Content.replace(/\n/g, '<br />') }}>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderNewEFLessonPlan = (chiTiet: EFChiTiet | undefined) => {
    if (!chiTiet || !Array.isArray(chiTiet.units_va_lessons) || chiTiet.units_va_lessons.length === 0) {
      return <p className="text-slate-400">{translate('courseInformation.lessonPlan.noData')}</p>;
    }
  
    const units = chiTiet.units_va_lessons;
    const uniqueUnitNumbers = Array.from(new Set(units.map(unit => unit.unit_so))).sort((a, b) => a - b);
  
    const filteredUnits = efUnitFilter === 'all'
      ? units
      : units.filter(unit => String(unit.unit_so) === efUnitFilter);
  
    return (
      <div className="space-y-4">
        <div className="mb-4">
          <label htmlFor="efUnitFilter" className="block text-sm font-medium text-slate-300 mb-1">{translate('courseInformation.lessonPlan.filterByUnitLabel')}</label>
          <select
            id="efUnitFilter"
            value={efUnitFilter}
            onChange={(e) => setEfUnitFilter(e.target.value)}
            className="block w-full md:w-1/3 bg-slate-700 border border-slate-600 rounded-md shadow-sm py-1.5 px-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 text-slate-200 text-sm"
          >
            <option value="all">{translate('courseInformation.lessonPlan.allUnitsLabel')}</option>
            {uniqueUnitNumbers.map(unitNo => (
              <option key={unitNo} value={String(unitNo)}>{`Unit ${unitNo}`}</option>
            ))}
          </select>
        </div>
  
        {filteredUnits.map((unit: EFUnit, unitIndex: number) => (
          <div key={unitIndex} className="bg-slate-800 shadow-lg rounded-lg p-3 md:p-4 border border-slate-700">
            <h3 className="text-lg md:text-xl font-semibold text-indigo-400 mb-2">
              {`Unit ${unit.unit_so}: ${unit.unit_ten_chu_de_chinh_bao_quat || `Unit ${unit.unit_so}`}`}
            </h3>
            
            {unit.unit_learning_objectives && (
              <div className="mb-3 p-2 bg-slate-750 rounded-md">
                <h5 className="text-sm md:text-base font-semibold text-slate-300 mb-1">{translate('courseInformation.lessonPlan.coreKnowledgeObjectives')} (Unit):</h5>
                <ul className="list-disc list-inside text-xs md:text-sm text-slate-400 space-y-0.5">
                  {Array.isArray(unit.unit_learning_objectives.core_vocabulary_groups) && unit.unit_learning_objectives.core_vocabulary_groups.length > 0 && 
                    <li><strong>{translate('courseInformation.courseDetails.vocabularyThemes')}:</strong> {unit.unit_learning_objectives.core_vocabulary_groups.join(', ')}</li>}
                  {unit.unit_learning_objectives.estimated_new_words > 0 && 
                    <li><strong>{translate('courseInformation.courseDetails.wordCount')}:</strong> {unit.unit_learning_objectives.estimated_new_words}</li>}
                  {Array.isArray(unit.unit_learning_objectives.key_grammar_points) && unit.unit_learning_objectives.key_grammar_points.length > 0 && 
                    <li><strong>{translate('courseInformation.courseDetails.grammarDetails')}:</strong> {unit.unit_learning_objectives.key_grammar_points.join('; ')}</li>}
                  {Array.isArray(unit.unit_learning_objectives.tenses_covered) && unit.unit_learning_objectives.tenses_covered.length > 0 && 
                    <li><strong>{translate('courseInformation.efFields.tensesStructuresCount')}:</strong> {unit.unit_learning_objectives.tenses_covered.join('; ')}</li>}
                  {Array.isArray(unit.unit_learning_objectives.notable_sentence_patterns) && unit.unit_learning_objectives.notable_sentence_patterns.length > 0 && 
                    <li><strong>{translate('common.sentencePatterns') || 'Notable Sentence Patterns'}:</strong> {unit.unit_learning_objectives.notable_sentence_patterns.join('; ')}</li>}
                </ul>
              </div>
            )}
            {unit.unit_skill_objectives && <p className="text-xs md:text-sm text-slate-400 mb-1"><strong>{translate('courseInformation.lessonPlan.coreSkillObjectives')}:</strong> {unit.unit_skill_objectives}</p>}
            {Array.isArray(unit.unit_real_world_situations) && unit.unit_real_world_situations.length > 0 && <p className="text-xs md:text-sm text-slate-400 mb-3"><strong>{translate('courseInformation.lessonPlan.prominentRealWorldSituations')}:</strong> {unit.unit_real_world_situations.join('; ')}</p>}
            
            <h5 className="text-sm md:text-base font-semibold text-slate-300 mb-1">{translate('courseInformation.lessonPlan.lessons')}:</h5>
            {Array.isArray(unit.lessons) && unit.lessons.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-600 text-xs md:text-sm">
                  <thead className="bg-slate-700">
                    <tr>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.lessonID')}</th>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.lessonName')}</th>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.mainSkills')}</th>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.topicContent')}</th>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.targetVocab')}</th>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.targetGrammar')}</th>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.realWorldSituation')}</th>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.forumAssignment')}</th>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.homework')}</th>
                      <th className="px-2 py-1 text-left font-medium text-slate-400">{translate('courseInformation.lessonPlan.lessonChecklistSteps')}</th>
                    </tr>
                  </thead>
                  <tbody className="bg-slate-750 divide-y divide-slate-600">
                    {unit.lessons.map((lesson: EFLesson, lessonIndex: number) => (
                      <tr key={lessonIndex} className={lessonIndex % 2 === 0 ? 'bg-slate-750' : 'bg-slate-700'}>
                        <td className="px-2 py-1 align-top text-slate-300">{lesson.lesson_id}</td>
                        <td className="px-2 py-1 align-top font-medium text-slate-200">{lesson.lesson_name}</td>
                        <td className="px-2 py-1 align-top text-slate-300">{Array.isArray(lesson.main_skills) ? lesson.main_skills.join(', ') : 'N/A'}</td>
                        <td className="px-2 py-1 align-top text-slate-300">{lesson.topic_content}</td>
                        <td className="px-2 py-1 align-top text-slate-300">{lesson.vocabulary_focus || 'N/A'}</td>
                        <td className="px-2 py-1 align-top text-slate-300">{lesson.grammar_focus || 'N/A'}</td>
                        <td className="px-2 py-1 align-top text-slate-300">{lesson.real_world_context || 'N/A'}</td>
                        <td className="px-2 py-1 align-top text-slate-300">
                            {lesson.forum_assignment ? `${lesson.forum_assignment.skill}: ${lesson.forum_assignment.content_note}` : 'N/A'}
                        </td>
                        <td className="px-2 py-1 align-top text-slate-300">{lesson.homework_workbook_reference || 'N/A'}</td>
                        <td className="px-2 py-1 align-top text-slate-300">
                          {Array.isArray(lesson.lesson_checklist_steps) && lesson.lesson_checklist_steps.length > 0 ? (
                            <ul className="list-decimal list-inside text-xs space-y-0.5">
                              {lesson.lesson_checklist_steps.map((step: string, stepIdx: number) => ( 
                                <li key={stepIdx}>{step}</li>
                              ))}
                            </ul>
                          ) : (translate('common.noData') || 'N/A')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-slate-500 italic text-xs md:text-sm">{translate('courseInformation.lessonPlan.noData')}</p>}
          </div>
        ))}
      </div>
    );
  };

  const renderOverview = () => {
    if (!selectedCourse) return null;

    if (selectedCourse.ef_course_type === 'new_format' && selectedCourse.ef_tong_quan && selectedCourse.ef_chi_tiet) {
        return renderEFNewOverview(selectedCourse.ef_tong_quan, selectedCourse.ef_chi_tiet);
    }
    
    if (selectedCourse.ef_course_type === 'old_format') {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                {renderDetailItem('courseInformation.courseDetails.targetAudience', selectedCourse.target_audience)}
                {renderDetailItem('courseInformation.courseDetails.outputLevel', selectedCourse.output_level)}
                {renderDetailItem('courseInformation.courseDetails.course_duration_weeks', selectedCourse.course_duration_weeks)}
                {renderDetailItem('courseInformation.courseDetails.lessonsPerWeek', selectedCourse.lessons_per_week)}
                {renderDetailItem('courseInformation.courseDetails.lessonDurationHours', selectedCourse.lesson_duration_hours)}
                {renderDetailItem('courseInformation.courseDetails.totalLessons', selectedCourse.total_lessons)}
                {renderDetailItem('courseInformation.courseDetails.overallGoal', selectedCourse.overall_goal)}
                {Array.isArray(selectedCourse.core_objectives) && selectedCourse.core_objectives.length > 0 &&
                    renderSection('courseInformation.courseDetails.coreObjectives', renderList(selectedCourse.core_objectives))}
                {Array.isArray(selectedCourse.key_pedagogical_features) && selectedCourse.key_pedagogical_features.length > 0 &&
                    renderSection('courseInformation.courseDetails.keyPedagogicalFeatures', 
                    <ul className="list-disc list-inside space-y-1">
                        {selectedCourse.key_pedagogical_features.map((feature: PedagogicalFeature, index: number) => (
                        <li key={index} className="text-slate-300 text-sm"><strong>{feature.feature_name}:</strong> {feature.description}</li>
                        ))}
                    </ul>
                    )}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
            {renderDetailItem('courseInformation.courseDetails.durationWeeks', selectedCourse.course_duration_weeks)}
            {renderDetailItem('courseInformation.courseDetails.lessonsPerWeek', selectedCourse.lessons_per_week)}
            {renderDetailItem('courseInformation.courseDetails.lessonDurationHours', selectedCourse.lesson_duration_hours)}
            {renderDetailItem('courseInformation.courseDetails.totalLessons', selectedCourse.total_lessons)}
            {renderDetailItem('courseInformation.courseDetails.overallGoal', selectedCourse.overall_goal)}
            {selectedCourse.knowledge_skills_summary && renderKnowledgeSkillsSummary(selectedCourse.knowledge_skills_summary)}
        </div>
    );
};

  const renderKnowledgeSkillsSummary = (summary: KnowledgeSkillsSummary) => {
    return (
      renderSection('courseInformation.courseDetails.knowledgeSkillsSummary', 
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {summary.grammar && renderDetailItem('courseInformation.courseDetails.grammarSummary', 
            <>
              {summary.grammar.tenses_structures_count && <p className="text-slate-300 text-sm">{translate('courseInformation.courseDetails.tensesStructuresCount')}: {summary.grammar.tenses_structures_count}</p>}
              {Array.isArray(summary.grammar.details) && summary.grammar.details.length > 0 && renderList(summary.grammar.details)}
            </>
          )}
          {summary.vocabulary && renderDetailItem('courseInformation.courseDetails.vocabularySummary', 
            <>
              {summary.vocabulary.word_count && <p className="text-slate-300 text-sm">{translate('courseInformation.courseDetails.wordCount')}: {summary.vocabulary.word_count}</p>}
              {Array.isArray(summary.vocabulary.themes) && summary.vocabulary.themes.length > 0 && renderList(summary.vocabulary.themes)}
            </>
          )}
          {renderDetailItem('courseInformation.courseDetails.listeningSkills', summary.listening)}
          {renderDetailItem('courseInformation.courseDetails.speakingSkills', summary.speaking)}
          {renderDetailItem('courseInformation.courseDetails.readingSkills', summary.reading)}
          {renderDetailItem('courseInformation.courseDetails.writingSkills', summary.writing)}
        </div>
      )
    );
  };

  const renderLessonPlan = () => {
    if (!selectedCourse) return null;

    if (selectedCourse.ef_course_type === 'new_format' && selectedCourse.ef_chi_tiet) {
        return renderNewEFLessonPlan(selectedCourse.ef_chi_tiet);
    }

    if (selectedCourse.ef_course_type === 'old_format' && selectedCourse.lesson_plan_html && typeof selectedCourse.lesson_plan_html === 'object') {
        return renderOldTableFromJson(selectedCourse.lesson_plan_html as LessonPlanJsonObject | RawEFTableRow[]);
    }
    
    if (typeof selectedCourse.lesson_plan_html === 'string' && selectedCourse.lesson_plan_html.trim() !== '') {
      return <div className="prose prose-sm md:prose-base max-w-none text-slate-300 bg-slate-800 p-3 rounded-lg shadow" dangerouslySetInnerHTML={{ __html: selectedCourse.lesson_plan_html }} />;
    }

    return <p className="text-slate-400">{translate('courseInformation.lessonPlan.noData')}</p>;
  };

  const commonTabClass = "px-3 py-2 font-medium text-sm md:text-base rounded-t-lg focus:outline-none transition-colors duration-150";
  const activeTabClass = `${commonTabClass} bg-slate-800 text-indigo-400 border-b-2 border-indigo-500`;
  const inactiveTabClass = `${commonTabClass} bg-slate-700 text-slate-400 hover:bg-slate-600 hover:text-slate-200`;

  if (isLoadingCategories) {
    return <div className="text-center py-8"><LoadingSpinner text={translate('courseInformation.loadingCategories')} /></div>;
  }
  
  const renderTopHeader = () => {
    if (selectedCategory || selectedCourse) {
      return (
        <div className="flex items-center space-x-3 mb-3 md:mb-4">
            <button 
                onClick={handleBack} 
                className="px-3 py-1.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm flex items-center"
                aria-label={translate('common.back')}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                {translate('common.back')}
            </button>
            <h2 className="text-xl md:text-2xl font-bold text-indigo-300 truncate">
                {selectedCourse ? selectedCourse.course_name : selectedCategory?.name}
            </h2>
        </div>
      );
    }
    return null; 
  };


  if (!selectedCategory) {
    return (
      <div className="space-y-4">
        {categories.length === 0 && <p className="text-slate-400">{translate('courseInformation.noCategories')}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category)}
              className="bg-slate-800 p-4 rounded-lg shadow-lg hover:bg-slate-700 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-left"
              aria-label={`${translate('common.selectCategory')} ${category.name}`}
            >
              <h3 className="text-lg font-semibold text-sky-400 mb-1">{category.name}</h3>
              <p className="text-xs text-slate-400">{translate(`courseInformation.categories.${category.id}Description`) || `Courses related to ${category.name}`}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (!selectedCourse) {
    return (
      <div>
        {renderTopHeader()}
        {selectedCategory.courses.length === 0 && <p className="text-slate-400">{translate('courseInformation.noCoursesInCategory')}</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {selectedCategory.courses.map(course => (
            <button
              key={course.id}
              onClick={() => handleSelectCourse(course.id!, selectedCategory.path, course.course_name!)}
              className="bg-slate-800 p-4 rounded-lg shadow-lg hover:bg-slate-700 transition-all duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-slate-900 text-left h-full flex flex-col justify-between"
               aria-label={`${translate('common.selectCourse')} ${course.course_name}`}
            >
              <div>
                <h4 className="text-md md:text-lg font-semibold text-sky-400 mb-1">{course.course_name}</h4>
                <p className="text-xs text-slate-400">{course.description}</p>
              </div>
              <span className="mt-2 text-xs text-indigo-400 self-start">{translate('common.viewDetails')} &rarr;</span>
            </button>
          ))}
        </div>
      </div>
    );
  }
  
  const showExpertAssessmentTab = selectedCourse?.ef_course_type === 'new_format' && !!selectedCourse.ef_tong_quan?.professional_expert_assessment;

  return (
    <div className="container mx-auto">
      {renderTopHeader()}
      
      {isLoadingCourse ? (
        <div className="text-center py-8"><LoadingSpinner text={translate('courseInformation.loadingCourse')} /></div>
      ) : (
        <>
          <div className="mb-3 md:mb-4 border-b border-slate-700">
            <nav className="flex space-x-1 md:space-x-2" aria-label={translate('common.tabsNavigation')}>
              <button onClick={() => setActiveTab('overview')} className={activeTab === 'overview' ? activeTabClass : inactiveTabClass}  aria-current={activeTab === 'overview' ? 'page' : undefined}>
                {translate('courseInformation.tabs.overview')}
              </button>
              <button onClick={() => setActiveTab('lessonPlan')} className={activeTab === 'lessonPlan' ? activeTabClass : inactiveTabClass}  aria-current={activeTab === 'lessonPlan' ? 'page' : undefined}>
                {translate('courseInformation.tabs.lessonPlan')}
              </button>
              {showExpertAssessmentTab && (
                <button onClick={() => setActiveTab('expertAssessment')} className={activeTab === 'expertAssessment' ? activeTabClass : inactiveTabClass}  aria-current={activeTab === 'expertAssessment' ? 'page' : undefined}>
                  {translate('courseInformation.tabs.expertAssessment')}
                </button>
              )}
            </nav>
          </div>

          {activeTab === 'overview' && renderOverview()}
          {activeTab === 'lessonPlan' && renderLessonPlan()}
          {activeTab === 'expertAssessment' && showExpertAssessmentTab && renderExpertAssessmentTabContent()}
        </>
      )}
    </div>
  );
};

export default CourseInformationPage;