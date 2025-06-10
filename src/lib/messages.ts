
import { AppMessage, MessageType } from '../../types'; // Corrected import path

// Enum for all unique global message keys
export enum AppMessageKey {
  // App general messages
  INITIALIZING_ADMIN = 'alertMessage.app.initializingAdmin',
  ADMIN_READY = 'alertMessage.app.adminReady',
  ADMIN_INIT_FAILED_CRITICAL = 'alertMessage.app.adminInitFailedCritical',
  ADMIN_INIT_ERROR = 'alertMessage.app.adminInitError', // expects {message}
  ADMIN_NOT_READY_SEARCH = 'alertMessage.app.adminNotReadySearch',
  SEARCH_TERM_REQUIRED = 'alertMessage.app.searchTermRequired',
  INVALID_SEARCH_FORMAT = 'alertMessage.app.invalidSearchFormat',
  SEARCHING = 'alertMessage.app.searching', // expects {searchTerm}
  STUDENTS_FOUND = 'alertMessage.app.studentsFound', // expects {count}, {searchTerm}
  NO_STUDENTS_FOUND = 'alertMessage.app.noStudentsFound', // expects {searchTerm}
  SEARCH_FAILED = 'alertMessage.app.searchFailed', // expects {message}
  LOADING_DETAILS_SHORT = 'alertMessage.app.loadingDetailsShort',
  LOADING_DETAILS_FAILED = 'alertMessage.app.loadingDetailsFailed', // expects {error}

  // Reset Placement Test messages
  RESET_PT_STARTING = 'alertMessage.resetPT.starting', // expects {fullName}
  RESET_PT_STEP_PROGRESS = 'alertMessage.resetPT.stepProgress', // expects {step}, {message}
  RESET_PT_SUCCESS = 'alertMessage.resetPT.success', // expects {fullName}
  RESET_PT_FAILURE = 'alertMessage.resetPT.failure', // expects {fullName}, {message}

  // Add Student messages
  ADD_STUDENT_SUCCESS = 'alertMessage.app.addStudentSuccess', // expects {fullName}, {defaultPassword}
  ADD_STUDENT_FAILURE = 'alertMessage.app.addStudentFailure', // expects {message}
  EMAIL_EXISTS = 'alertMessage.app.emailExists', // expects {email}
  PHONE_EXISTS = 'alertMessage.app.phoneExists', // expects {phone}

  // Delete Student Account messages
  DELETING_ACCOUNT = 'alertMessage.app.deletingAccount', // expects {fullName}
  DELETE_ACCOUNT_SUCCESS = 'alertMessage.app.deleteAccountSuccess', // expects {fullName}
  DELETE_ACCOUNT_FAILURE = 'alertMessage.app.deleteAccountFailure', // expects {message}

  // Course Information messages
  COURSE_LOAD_FAILED = 'alertMessage.app.courseLoadFailed', // Corrected path to match JSON, expects {courseName}, {error}
}

// Mapping of message keys to their default MessageType
export const DefaultMessageTypes: Readonly<Record<AppMessageKey, MessageType>> = {
  [AppMessageKey.INITIALIZING_ADMIN]: MessageType.INFO,
  [AppMessageKey.ADMIN_READY]: MessageType.SUCCESS,
  [AppMessageKey.ADMIN_INIT_FAILED_CRITICAL]: MessageType.ERROR,
  [AppMessageKey.ADMIN_INIT_ERROR]: MessageType.ERROR,
  [AppMessageKey.ADMIN_NOT_READY_SEARCH]: MessageType.ERROR,
  [AppMessageKey.SEARCH_TERM_REQUIRED]: MessageType.WARNING,
  [AppMessageKey.INVALID_SEARCH_FORMAT]: MessageType.ERROR,
  [AppMessageKey.SEARCHING]: MessageType.INFO,
  [AppMessageKey.STUDENTS_FOUND]: MessageType.SUCCESS,
  [AppMessageKey.NO_STUDENTS_FOUND]: MessageType.INFO,
  [AppMessageKey.SEARCH_FAILED]: MessageType.ERROR,
  [AppMessageKey.LOADING_DETAILS_SHORT]: MessageType.INFO,
  [AppMessageKey.LOADING_DETAILS_FAILED]: MessageType.WARNING,

  [AppMessageKey.RESET_PT_STARTING]: MessageType.INFO,
  [AppMessageKey.RESET_PT_STEP_PROGRESS]: MessageType.INFO, // Type can be overridden for errors
  [AppMessageKey.RESET_PT_SUCCESS]: MessageType.SUCCESS,
  [AppMessageKey.RESET_PT_FAILURE]: MessageType.ERROR,

  [AppMessageKey.ADD_STUDENT_SUCCESS]: MessageType.SUCCESS,
  [AppMessageKey.ADD_STUDENT_FAILURE]: MessageType.ERROR,
  [AppMessageKey.EMAIL_EXISTS]: MessageType.ERROR,
  [AppMessageKey.PHONE_EXISTS]: MessageType.ERROR,

  [AppMessageKey.DELETING_ACCOUNT]: MessageType.INFO,
  [AppMessageKey.DELETE_ACCOUNT_SUCCESS]: MessageType.SUCCESS,
  [AppMessageKey.DELETE_ACCOUNT_FAILURE]: MessageType.ERROR,

  [AppMessageKey.COURSE_LOAD_FAILED]: MessageType.ERROR,
};

interface CreateAppMessageParams {
  key: AppMessageKey;
  translate: (key: string, replacements?: Record<string, string>) => string;
  replacements?: Record<string, string | number | undefined | null>; // Allow null for optional replacements
  typeOverride?: MessageType;
}

/**
 * Creates an AppMessage object.
 * @param key - The AppMessageKey for the message.
 * @param translate - The translation function from LanguageContext.
 * @param replacements - Optional replacements for placeholders in the message.
 * @param typeOverride - Optional MessageType to override the default.
 * @returns An AppMessage object.
 */
export function createAppMessage({
  key,
  translate,
  replacements,
  typeOverride,
}: CreateAppMessageParams): AppMessage {
  const stringReplacements: Record<string, string> = {};
  if (replacements) {
    for (const repKey in replacements) {
      if (replacements[repKey] !== undefined && replacements[repKey] !== null) {
        stringReplacements[repKey] = String(replacements[repKey]);
      }
    }
  }

  const translatedText = translate(key as string, stringReplacements); // Cast key to string for translate fn
  
  let messageType = typeOverride || DefaultMessageTypes[key];
  
  if (!messageType) {
    console.warn(`No default message type found for key: ${key}. Defaulting to INFO.`);
    messageType = MessageType.INFO; // Fallback type
  }

  return {
    text: translatedText,
    type: messageType,
    id: Date.now(), // Generate a unique ID for the message (optional, but good for list keys)
  };
}
