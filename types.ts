

export interface Student {
  id: string; // UserID (GUID), mapped from StudentSearchResultItem.id. Used for OTP API's UserId param.
  studentId: string; // Specific Student GUID, mapped from StudentSearchResultItem.studentId. Used for PT API's studentId path param.
  studentCode: string; // Human-readable student code ("Mã học viên"), mapped from StudentSearchResultItem.studentCode.
  fullName: string;
  phoneNumber: string | null;
  email: string;
  birthday: string | null; // ISO date string or other format
  schoolName: string | null;
  class: string | null; // Lớp
  status: string | null; // This will now be "Gói học"
  
  object?: 'Leads' | 'Client' | string; 

  customerType?: 'Leads' | 'Client' | string; 

  type?: string; // e.g., "Academic"
  gender?: string | null;
  courseLevel?: string;
  schoolId?: string | null;
  grade?: string;
  userName?: string;
  passwordDefault?: string;
  event?: string | null;
  courseId?: string;
  provinceId?: string | null;
  districtId?: string | null;
  expiredDate?: string;
  totalLesson?: number;
  totalLessonDone?: number;
  emailConfirm?: boolean;
  isDeleted?: boolean;
  createdUserId?: string;
  updatedUserId?: string | null;
  createdFullName?: string | null;
  updatedFullName?: string | null;
  createdDate?: string;
  updatedDate?: string | null;
}

export interface StudentSearchResultItem {
  // This structure directly matches the items array in the API response
  fullName: string;
  studentCode: string; // Human-readable student code ("Mã học viên").
  birthday: string | null;
  email: string;
  type?: string;
  gender?: string | null;
  courseLevel?: string;
  schoolId?: string | null;
  schoolName: string | null;
  phoneNumber: string | null;
  grade?: string;
  class: string | null;
  userName?: string;
  passwordDefault?: string;
  object: 'Leads' | 'Client' | string; 
  status: string | null;
  event?: string | null;
  studentId: string; 
  id: string; 
  courseId?: string;
  provinceId?: string | null;
  districtId?: string | null;
  expiredDate?: string;
  totalLesson?: number;
  totalLessonDone?: number;
  emailConfirm?: boolean;
  isDeleted?: boolean;
  createdUserId?: string;
  updatedUserId?: string | null;
  createdFullName?: string | null;
  updatedFullName?: string | null;
  createdDate?: string;
  updatedDate?: string | null;
}


export interface StudentSearchResult {
  items: StudentSearchResultItem[]; 
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface OtpData {
  otpEmail: string | null;
  otpPhoneNumber: string | null;
  isConfirmOTPEmail: boolean;
  isConfirmOTPPhoneNumber: boolean;
}

export interface SkillScore {
  skill: string;
  scores: number;
  correctCount: number;
  totalCount: number;
  percent: number;
}

export interface PlacementTestLevelResult {
  level: string | null;
  correctCount: number;
  correctTotal: number;
  skillScores: SkillScore[];
}

export interface PlacementTestData {
  courseName: string | null;
  currentLevel: string | null;
  recommendedLevel: string | null;
  placementTestResults: PlacementTestLevelResult[];
}

export interface FselApiResponse<T> {
  isOK: boolean;
  result: T;
  errorMessages?: (string | { errorCode: string; errors?: { fieldName: string; errorValues: string[] }[] })[];
  statusCode?: number;
  message?: string; 
}

export interface UserSignUpPayload {
  fullName: string;
  email: string;
  password?: string; 
  role?: string; 
  referralCode?: string | null;
  platformCode?: string; 
}

export interface UserSignUpResult {
  id: string; 
}

export interface UpdateCodeStudentPayload {
  userId: string;
  birthday: string | null;
}

export interface UpdateStudentInfoPayload {
  fullName: string;
  birthday: string | null;
  school: string | null; 
  address: string | null;
  email: string;
  phoneNumber: string | null;
  schoolGrade: string | null; 
  schoolClass: string | null; 
  parent: { fullName: string | null; email: string | null; phoneNumber: string | null };
}

export enum MessageType {
  INFO = 'info',
  SUCCESS = 'success',
  ERROR = 'error',
  WARNING = 'warning',
}

export interface AppMessage {
  text: string;
  type: MessageType;
  id?: number; 
}

export interface ProgressMessage {
  step: string;
  message: string;
  isError?: boolean;
}

export interface GeminiAnalysisResult {
  analysis: string;
  telemarketingScripts: string;
}

export type Language = 'vi' | 'en';

export interface Translations {
  [key: string]: string | Translations; 
}

export interface LanguageContextType {
  language: Language;
  translate: (key: string, replacements?: Record<string, string>) => string;
  setLanguage: (language: Language) => void;
  translations: Translations | null;
}

export interface AddStudentFormData {
  fullName: string;
  email: string;
  phoneNumber: string | null;
  birthday: string | null; 
}

// Types for Alert Settings
export type AlertPosition = 
  | 'top-left' | 'top-center' | 'top-right' 
  | 'bottom-left' | 'bottom-center' | 'bottom-right';

export interface AlertLayoutSettings {
  padding?: string;       // e.g., "p-3", "p-4"
  shadow?: string;        // e.g., "shadow-md", "shadow-lg"
  rounded?: string;       // e.g., "rounded-md", "rounded-lg"
  flex?: string;          // e.g., "flex justify-between items-center"
}

export interface AlertTypeSetting {
  backgroundColor?: string;      // Hex or rgba CSS color string
  borderColor?: string;          // Hex or rgba CSS color string
  textColor?: string;            // Hex or rgba CSS color string
  borderWidth?: string;          // e.g., "1px", "0px"
  borderStyle?: string;          // e.g., "solid", "dashed"
  layout?: AlertLayoutSettings;
}

export interface AlertSettings {
  position: AlertPosition;
  defaultShowDismissButton: boolean;
  duration: number; // Global duration for all alert types
  // New global text style properties
  fontSize?: string; // e.g., "text-sm", "text-base"
  fontWeight?: string; // e.g., "font-normal", "font-bold"
  fontStyle?: string; // e.g., "italic", "not-italic"
  textDecoration?: string; // e.g., "underline", "no-underline"
  types: {
    [key in MessageType]: AlertTypeSetting;
  };
}

export interface AlertSettingsContextType {
  settings: AlertSettings | null;
  isLoading: boolean;
  updateSettings: (newSettings: AlertSettings) => void;
  resetSettings: () => void;
}

// Types for Course Information Page
export interface GrammarSummary {
  tenses_structures_count: string;
  details: string[];
}

export interface VocabularySummary {
  word_count: string;
  themes: string[];
}

export interface KnowledgeSkillsSummary {
  grammar: GrammarSummary;
  vocabulary: VocabularySummary;
  listening: string;
  speaking: string;
  reading: string;
  writing: string;
}

// Standard TableCell structure (target for transformation)
export interface TableCell {
  Content: string;
  OrderCol: number;
  OrderRow: number;
  Unit?: string;
}
export interface TableRow extends Array<TableCell> {}

export interface LessonPlanJsonObject {
  tableRows: TableRow[];
}

// Raw types for English Foundation JSON structure (source for transformation)
export interface RawEFTableCell {
  Content: string;
  Unit?: string; 
  [key: string]: any; 
}
export interface RawEFTableRow extends Array<RawEFTableCell> {}

export interface RawEFLessonPlanJsonObject {
  tableRows: RawEFTableRow[];
}

export interface PedagogicalFeature {
  feature_name: string;
  description: string;
}


// ======= NEW TYPES FOR DETAILED ENGLISH FOUNDATION COURSE STRUCTURE (based on a1.json) =======

export interface EFTargetAudience {
  do_tuoi: string;
  trinh_do_dau_vao: string;
  ly_do_hoc_tap_pho_bien: string[];
}

export interface EFOutputObjectiveDetail {
  mo_ta_chung: string;
  chi_tiet_ky_nang: string[];
}

export interface EFKnowledgeOutput {
  total_estimated_new_vocabulary?: string;
  total_tenses_learned?: string[];
  total_core_grammar_patterns?: string[];
  total_real_world_situations?: string;
}

export interface EFCourseStructureDuration {
  total_units_count?: number;
  tong_so_units?: number; // Keep for compatibility if older JSON uses it
  typical_lessons_per_unit?: string; 
  so_lessons_moi_unit?: number; // Keep for compatibility
  estimated_hours_per_lesson?: string;
  total_estimated_learning_hours?: string;
  tong_thoi_gian_hoc_va_kiem_tra?: string; // Keep for compatibility
}

export interface EFSixComponentAssessment {
  listening_assessment: string;
  speaking_assessment: string;
  reading_assessment: string;
  writing_assessment: string;
  vocabulary_assessment: string;
  grammar_assessment: string;
}

export interface EFSwotAnalysis {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

export interface EFProfessionalExpertAssessment {
  evaluation_based_on_six_components: EFSixComponentAssessment;
  swot_analysis: EFSwotAnalysis;
}

export interface EFAssessmentConclusion {
  diem_manh_lo_trinh: string[]; 
  su_phu_hop_voi_muc_tieu_khoa_hoc: string;
  su_chuan_bi_for_higher_levels: string[];
  professional_expert_assessment?: EFProfessionalExpertAssessment; // This is correct location
}

export interface EFTongQuan_Generic {
  course_name?: string; 
  level_CEFR?: string;  
  level_name?: string;  
  doi_tuong_muc_tieu: EFTargetAudience;
  muc_tieu_dau_ra_chung: EFOutputObjectiveDetail; 
  so_luong_hoa_dau_ra_kien_thuc_du_kien: EFKnowledgeOutput;
  cau_truc_va_thoi_luong_khoa_hoc: EFCourseStructureDuration; 
  danh_gia_tong_the_va_ket_luan: EFAssessmentConclusion;
  professional_expert_assessment?: EFProfessionalExpertAssessment; // This is where transformed data goes
}

export interface EFLessonStageChecklistStep {
  buoc: string;
  muc_dich: string;
}

export interface EFGeneralLessonStructure {
  checklist_steps_description: EFLessonStageChecklistStep[];
  vai_tro_lesson_stage_checklist: string;
}

export interface EFToolRole {
  homework_workbook: string;
  progress_test: string;
  reading_writing_portfolio: string;
}

export interface EFSupplementaryElements {
  bai_giang_video_tuong_tac: string;
  dien_dan_lop_hoc_cung_AI: string;
}

export interface EFTeachingMethodsTools {
  checklist_role?: string; 
  blended_learning_approach: string;
  assessment_and_reinforcement: EFToolRole;
  digital_tools_integration: EFSupplementaryElements;
  personalization_features?: string[]; 
}

export interface EFForumAssignment {
  skill: string;
  content_note: string;
}

export interface EFLesson {
  lesson_id: string;
  lesson_name: string;
  main_skills: string[];
  topic_content: string;
  vocabulary_focus: string | null;
  grammar_focus: string | null;
  real_world_context: string | null;
  forum_assignment: EFForumAssignment | null;
  homework_workbook_reference: string | null;
  lesson_checklist_steps?: string[]; 
}

export interface EFUnitLearningObjectives {
    core_vocabulary_groups: string[];
    estimated_new_words: number;
    key_grammar_points: string[];
    tenses_covered: string[];
    notable_sentence_patterns: string[];
}

export interface EFUnit {
  unit_so: number;
  unit_ten_chu_de_chinh_bao_quat: string;
  unit_learning_objectives: EFUnitLearningObjectives;
  unit_skill_objectives: string;
  unit_real_world_situations: string[];
  lessons: EFLesson[];
}

export interface EFChiTiet {
  lesson_structure_and_objectives: EFGeneralLessonStructure;
  teaching_methodology_and_tools: EFTeachingMethodsTools;
  units_va_lessons: EFUnit[];
}

export interface EnglishFoundationNewFormatCourse { // Raw structure from JSON
  tong_quan_ve_khoa_hoc: { 
    course_name?: string;
    level_CEFR?: string;
    level_name?: string;
    doi_tuong_muc_tieu: EFTargetAudience;
    muc_tieu_dau_ra_chung_khoa_hoc: EFOutputObjectiveDetail;
    so_luong_hoa_dau_ra_kien_thuc_du_kien: EFKnowledgeOutput;
    cau_truc_va_thoi_luong_khoa_hoc: EFCourseStructureDuration;
    danh_gia_tong_the_va_ket_luan: EFAssessmentConclusion; // This contains professional_expert_assessment
    // professional_expert_assessment?: EFProfessionalExpertAssessment; // REMOVED from here
    [key: string]: any; 
  };
  chi_tiet_ve_khoa_hoc: EFChiTiet;
}

// ======= END NEW TYPES FOR DETAILED EF COURSE STRUCTURE =======

export interface Course {
  id?: string; 
  course_name: string;
  course_duration_weeks?: number; 
  lessons_per_week?: number;
  lesson_duration_hours?: number;
  total_lessons?: number;
  overall_goal?: string; 
  lesson_plan_html?: LessonPlanJsonObject | RawEFLessonPlanJsonObject | string | undefined; 
  fileName?: string; 
  description?: string; 
  course_duration_months?: number | string; 
  number_of_unit_tests?: number;
  number_of_final_tests?: number;
  knowledge_skills_summary?: KnowledgeSkillsSummary; 

  // English Foundation specific fields
  target_audience?: string; // For old EF format
  output_level?: string; // For old EF format
  core_objectives?: string[]; // For old EF format
  key_pedagogical_features?: PedagogicalFeature[]; // For old EF format

  ef_course_type?: 'new_format' | 'old_format'; 
  ef_tong_quan?: EFTongQuan_Generic; // This will now include professional_expert_assessment
  ef_chi_tiet?: EFChiTiet;
}

// This is for the OLD structure as fetched from EnglishFoundation JSON files (A2, B1 before a1.json update)
export interface EnglishFoundationRawCourse {
  course_name: string;
  target_audience: string;
  output_level: string;
  core_objectives: string[];
  course_duration_weeks: number;
  course_duration_months: string;
  lessons_per_week: number;
  lesson_duration_hours: number;
  total_lessons: number;
  number_of_unit_tests?: number; 
  number_of_final_tests?: number; 
  overall_goal: string;
  knowledge_skills_summary?: KnowledgeSkillsSummary;
  lesson_plan_html?: RawEFLessonPlanJsonObject; 
  key_pedagogical_features?: PedagogicalFeature[];
}


export interface CourseCategory {
  id: string; 
  name: string; 
  path: string; 
  courses: Partial<Course>[]; 
}

// Student Detail Tab Type (moved from StudentManagementPage)
export type ActiveDetailTab = 'info' | 'pt' | 'ai';

// API Error Keys (conceptual for translation, not direct types)
export interface ApiErrorTranslations {
  default: string;
  otpError: string;
  ptError: string;
  missingUserIdError: string;
  missingStudentEntityIdError: string;
}

// Product Packages Types
export interface ProductPackageItem {
  id: string;
  eventId: string;
  code: string;
  name: string;
  price: number;
  priceMonth: number;
  monthNumber: number;
  monthBonus: number;
  dayBonus: number;
  referToken: number;
  bonusCoins: number;
  imagePaths: string[];
  eventDescription: string;
  description: string | null;
  incentivesWhenPurchasing: string;
  suggests: string[];
}

export interface ProductPackageApiResponse {
  result: ProductPackageItem[];
  errorMessages: any[]; // Consider defining this further if needed
  isOK: boolean;
  statusCode: number;
}
