
import { API_BASE_URL_USER, API_BASE_URL_AUTH, API_BASE_URL_COURSE, DEFAULT_SIGNUP_PASSWORD } from '../constants';
import { StudentSearchResult, OtpData, PlacementTestData, FselApiResponse, Student, UserSignUpPayload, UserSignUpResult, UpdateCodeStudentPayload, UpdateStudentInfoPayload, AddStudentFormData, StudentSearchResultItem } from '../types';
import { getAdminToken } from './authService';
import { formatDate, extractApiErrorMessage, isValidEmail, isValidPhoneNumber } from '../utils';

export async function searchStudents(searchTerm: string, page: number = 1, pageSize: number = 10): Promise<FselApiResponse<StudentSearchResult>> {
  const token = getAdminToken();
  if (!token) throw new Error('Admin token not found.');

  const apiUrl = `${API_BASE_URL_USER}/v1/admin/student/search-students?IsDelete=false&page=${page}&pageSize=${pageSize}&keyword=${encodeURIComponent(searchTerm)}`;
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

export async function getOtpForStudent(userId: string): Promise<FselApiResponse<OtpData>> {
  const token = getAdminToken();
  if (!token) throw new Error('Admin token not found.');

  const apiUrl = `${API_BASE_URL_USER}/v1.1/admin/student/get-otp-for-student?UserId=${userId}`;
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

export async function getPlacementTestResults(studentId: string): Promise<FselApiResponse<PlacementTestData>> { 
  const token = getAdminToken();
  if (!token) throw new Error('Admin token not found.');

  // API path suggests studentId is the GUID for the placement test context
  const apiUrl = `${API_BASE_URL_COURSE}/v1.1/placement-test-result/placement-test/${studentId}`;
  const response = await fetch(apiUrl, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Authorization': `Bearer ${token}`
    }
  });
  return response.json();
}

export async function resetPlacementTestProcess(
  studentData: Student,
  onProgress: (step: string, messageKey: string, replacements?: Record<string, string | number | null | undefined>, isError?: boolean) => void
): Promise<{success: boolean, message: string, newStudentData?: StudentSearchResultItem}> { // Return StudentSearchResultItem
  const token = getAdminToken();
  if (!token) {
    return { success: false, message: "Admin token not found." }; 
  }

  const { id: originalUserId, fullName, email, phoneNumber, birthday, schoolName, class: studentClass } = studentData;

  try {
    // Step 1: Delete old user account
    onProgress("1", "deleteOldAccountStart", { userId: originalUserId });
    const deleteUserUrl = `${API_BASE_URL_USER}/v1/admin/student/delete-user-by-userid/${originalUserId}`;
    const deleteResponse = await fetch(deleteUserUrl, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' }
    });
    const deleteResponseData: FselApiResponse<{}> = await deleteResponse.json();
    if (!deleteResponse.ok || !deleteResponseData.isOK) {
      throw new Error(`Failed to delete old account. ${extractApiErrorMessage(deleteResponseData)}`);
    }
    onProgress("1", "deleteOldAccountSuccess");

    // Step 2: Create new account
    onProgress("2", "createNewAccountStart", { fullName, email });
    const signUpUrl = `${API_BASE_URL_AUTH}/v1.1/user/sign-up`;
    const signUpPayload: UserSignUpPayload = {
      fullName,
      email,
      password: DEFAULT_SIGNUP_PASSWORD,
      role: "Student",
      referralCode: null,
      platformCode: "LMS"
    };
    const signUpResponse = await fetch(signUpUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(signUpPayload)
    });
    const signUpResponseData: FselApiResponse<UserSignUpResult> = await signUpResponse.json();
    if (signUpResponseData.statusCode !== 200 || !signUpResponseData.isOK || !signUpResponseData.result?.id) {
      throw new Error(`Failed to create new account. ${extractApiErrorMessage(signUpResponseData)}`);
    }
    const newUserId = signUpResponseData.result.id;
    onProgress("2", "createNewAccountSuccess", { newUserId });

    // Step 3: Confirm OTP
    onProgress("3", "fetchOtpStart", { newUserId });
    const getOtpUrl = `${API_BASE_URL_USER}/v1.1/admin/student/get-otp-for-student?UserId=${newUserId}`;
    const getOtpResponse = await fetch(getOtpUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' }
    });
    const getOtpResponseData: FselApiResponse<OtpData> = await getOtpResponse.json();
    if (!getOtpResponse.ok || !getOtpResponseData.isOK || !getOtpResponseData.result?.otpEmail) {
      throw new Error(`Failed to fetch OTP. ${extractApiErrorMessage(getOtpResponseData)}`);
    }
    const otpValue = getOtpResponseData.result.otpEmail;
    onProgress("3", "fetchOtpGotOtp", { otpValue, email });

    const confirmOtpUrl = `${API_BASE_URL_AUTH}/v1.1/user/confirm-otp-sign-up`;
    const confirmOtpPayload = { email, otp: otpValue };
    const confirmOtpResponse = await fetch(confirmOtpUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(confirmOtpPayload)
    });
    const confirmOtpResponseData: FselApiResponse<{}> = await confirmOtpResponse.json();
    if (confirmOtpResponseData.statusCode !== 200 || !confirmOtpResponseData.isOK) {
      throw new Error(`Failed to confirm OTP. ${extractApiErrorMessage(confirmOtpResponseData)}`);
    }
    onProgress("3", "confirmOtpSuccess");
    
    // Step 3.1: Update student code and birthday
    onProgress("3.1", "updateCodeBirthdayStart", { newUserId });
    const updateCodeStudentUrl = `${API_BASE_URL_USER}/v1.1/user/update-code-student`;
    const formattedBirthdayForCodeUpdate = birthday ? formatDate(birthday, 'yyyy-MM-dd') : null;
    const updateCodeStudentPayload: UpdateCodeStudentPayload = { userId: newUserId, birthday: formattedBirthdayForCodeUpdate };
    const updateCodeStudentResponse = await fetch(updateCodeStudentUrl, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(updateCodeStudentPayload)
    });
    const updateCodeStudentResponseData: FselApiResponse<{}> = await updateCodeStudentResponse.json();
    if (updateCodeStudentResponseData.statusCode !== 200 || !updateCodeStudentResponseData.isOK) {
        throw new Error(`Step 3.1 - Failed to update student code/birthday. ${extractApiErrorMessage(updateCodeStudentResponseData)}`);
    }
    onProgress("3.1", "updateCodeBirthdaySuccess");

    // Step 3.2: Search for new account to get StudentID (student entity's GUID)
    onProgress("3.2", "searchNewAccountStart", { email });
    const searchNewUrl = `${API_BASE_URL_USER}/v1/admin/student/search-students?IsDelete=false&page=1&pageSize=1&keyword=${encodeURIComponent(email)}`;
    const searchNewResponse = await fetch(searchNewUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' }
    });
    const searchNewResponseData: FselApiResponse<StudentSearchResult> = await searchNewResponse.json();
    if (!searchNewResponse.ok || !searchNewResponseData.isOK || !searchNewResponseData.result || searchNewResponseData.result.items.length === 0 || !searchNewResponseData.result.items[0].studentId) {
        throw new Error("Could not find the newly created account or its StudentID for Step 4.");
    }
    const newStudentAPIData = searchNewResponseData.result.items[0];
    const newStudentIdForUpdate = newStudentAPIData.studentId; 
    onProgress("3.2", "searchNewAccountSuccess", { newStudentId: newStudentIdForUpdate });


    // Step 4: Update full account information
    onProgress("4", "updateFullInfoStart", { newStudentId: newStudentIdForUpdate });
    const updateUserUrl = `${API_BASE_URL_USER}/v1/admin/student/${newStudentIdForUpdate}`; 
    const formattedUpdateBirthday = birthday ? formatDate(birthday, 'yyyy-MM-dd') : null;
    const updateUserPayload: UpdateStudentInfoPayload = {
      fullName,
      birthday: formattedUpdateBirthday,
      school: schoolName,
      address: null, 
      email,
      phoneNumber,
      schoolGrade: null, 
      schoolClass: studentClass,
      parent: { fullName: null, email: null, phoneNumber: null }
    };
    const updateResponse = await fetch(updateUserUrl, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(updateUserPayload)
    });
    const updateResponseData: FselApiResponse<{}> = await updateResponse.json();
    if (updateResponseData.statusCode !== 200 || !updateResponseData.isOK) {
      throw new Error(`Failed to update full account information. ${extractApiErrorMessage(updateResponseData)}`);
    }
    onProgress("4", "updateFullInfoSuccess");

    return { success: true, message: "Placement Test Reset process completed successfully!", newStudentData: newStudentAPIData };

  } catch (error: any) {
    console.error('Error in resetPlacementTestProcess:', error);
    onProgress("PROCESS_FAILED", error.message || "An unknown error occurred during reset.", {} , true);
    return { success: false, message: error.message || "An unknown error occurred." };
  }
}

export async function addStudentProcess(
  formData: AddStudentFormData,
  translate: (key: string, replacements?: Record<string, string>) => string
): Promise<{ success: boolean; messageKey: string; replacements?: Record<string, string>; newStudent?: StudentSearchResultItem; isValidationError?: boolean }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, messageKey: "alertMessage.app.adminNotReadySearch" };
  }

  const { fullName, email, phoneNumber, birthday } = formData; // schoolName and studentClass removed

  try {
    // Step 0: Pre-check email
    const emailSearchResponse = await searchStudents(email, 1, 1);
    if (emailSearchResponse.isOK && emailSearchResponse.result && emailSearchResponse.result.items.length > 0) {
      return { success: false, messageKey: "alertMessage.app.emailExists", replacements: { email }, isValidationError: true };
    } else if (!emailSearchResponse.isOK) {
        throw new Error(`Pre-check for email failed. ${extractApiErrorMessage(emailSearchResponse)}`);
    }

    // Step 0.1: Pre-check phone (if provided)
    if (phoneNumber && isValidPhoneNumber(phoneNumber)) {
      const phoneSearchResponse = await searchStudents(phoneNumber, 1, 1);
      if (phoneSearchResponse.isOK && phoneSearchResponse.result && phoneSearchResponse.result.items.length > 0) {
        return { success: false, messageKey: "alertMessage.app.phoneExists", replacements: { phone: phoneNumber }, isValidationError: true };
      } else if (!phoneSearchResponse.isOK) {
         throw new Error(`Pre-check for phone failed. ${extractApiErrorMessage(phoneSearchResponse)}`);
      }
    }

    // Step 1: Create new account (Sign Up)
    const signUpUrl = `${API_BASE_URL_AUTH}/v1.1/user/sign-up`;
    const signUpPayload: UserSignUpPayload = {
      fullName,
      email,
      password: DEFAULT_SIGNUP_PASSWORD,
      role: "Student",
      platformCode: "LMS"
    };
    const signUpResponse = await fetch(signUpUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(signUpPayload)
    });
    const signUpResponseData: FselApiResponse<UserSignUpResult> = await signUpResponse.json();
    if (signUpResponseData.statusCode !== 200 || !signUpResponseData.isOK || !signUpResponseData.result?.id) {
      throw new Error(`Failed to create new account. ${extractApiErrorMessage(signUpResponseData)}`);
    }
    const newUserId = signUpResponseData.result.id;

    // Step 2: Fetch OTP (to auto-confirm)
    const getOtpUrl = `${API_BASE_URL_USER}/v1.1/admin/student/get-otp-for-student?UserId=${newUserId}`;
    const getOtpResponse = await fetch(getOtpUrl, {
      method: 'GET',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' }
    });
    const getOtpResponseData: FselApiResponse<OtpData> = await getOtpResponse.json();
    if (!getOtpResponse.ok || !getOtpResponseData.isOK || !getOtpResponseData.result?.otpEmail) {
      throw new Error(`Failed to fetch OTP for new account. ${extractApiErrorMessage(getOtpResponseData)}`);
    }
    const otpValue = getOtpResponseData.result.otpEmail;

    // Step 3: Confirm OTP
    const confirmOtpUrl = `${API_BASE_URL_AUTH}/v1.1/user/confirm-otp-sign-up`;
    const confirmOtpPayload = { email, otp: otpValue };
    const confirmOtpResponse = await fetch(confirmOtpUrl, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(confirmOtpPayload)
    });
    const confirmOtpResponseData: FselApiResponse<{}> = await confirmOtpResponse.json();
    if (confirmOtpResponseData.statusCode !== 200 || !confirmOtpResponseData.isOK) {
      throw new Error(`Failed to confirm OTP for new account. ${extractApiErrorMessage(confirmOtpResponseData)}`);
    }
    
    // Step 4: Update student code and birthday
    const updateCodeStudentUrl = `${API_BASE_URL_USER}/v1.1/user/update-code-student`;
    const formattedBirthdayForCodeUpdate = birthday ? formatDate(birthday, 'yyyy-MM-dd') : null;
    const updateCodeStudentPayload: UpdateCodeStudentPayload = { userId: newUserId, birthday: formattedBirthdayForCodeUpdate };
    const updateCodeStudentResponse = await fetch(updateCodeStudentUrl, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify(updateCodeStudentPayload)
    });
    const updateCodeStudentResponseData: FselApiResponse<{}> = await updateCodeStudentResponse.json();
    if (updateCodeStudentResponseData.statusCode !== 200 || !updateCodeStudentResponseData.isOK) {
        throw new Error(`Failed to update student code/birthday. ${extractApiErrorMessage(updateCodeStudentResponseData)}`);
    }

    // Step 5: Search for new account to get StudentID and then update full info
    const searchNewUrl = `${API_BASE_URL_USER}/v1/admin/student/search-students?IsDelete=false&page=1&pageSize=1&keyword=${encodeURIComponent(email)}`;
    const searchNewResponse = await fetch(searchNewUrl, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' }
    });
    const searchNewResponseData: FselApiResponse<StudentSearchResult> = await searchNewResponse.json();
    if (!searchNewResponse.ok || !searchNewResponseData.isOK || !searchNewResponseData.result || searchNewResponseData.result.items.length === 0 || !searchNewResponseData.result.items[0].studentId) {
        throw new Error("Could not retrieve the newly created student's full details (StudentID missing).");
    }
    const newStudentAPIData = searchNewResponseData.result.items[0];
    const newStudentIdForUpdate = newStudentAPIData.studentId;

    const updateUserUrl = `${API_BASE_URL_USER}/v1/admin/student/${newStudentIdForUpdate}`;
    const formattedUpdateBirthday = birthday ? formatDate(birthday, 'yyyy-MM-dd') : null;
    const updateUserPayload: UpdateStudentInfoPayload = {
      fullName,
      birthday: formattedUpdateBirthday,
      school: null, // schoolName removed from form
      address: null, 
      email,
      phoneNumber,
      schoolGrade: null, 
      schoolClass: null, // studentClass removed from form
      parent: { fullName: null, email: null, phoneNumber: null } 
    };
    const updateResponse = await fetch(updateUserUrl, {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(updateUserPayload)
    });
    const updateResponseData: FselApiResponse<{}> = await updateResponse.json();
    if (updateResponseData.statusCode !== 200 || !updateResponseData.isOK) {
      console.error(`Partial success: Account created but failed to update full information for student ${newStudentIdForUpdate}. Error: ${extractApiErrorMessage(updateResponseData)}`);
    }

    return { 
      success: true, 
      messageKey: "alertMessage.app.addStudentSuccess", 
      replacements: { fullName, defaultPassword: DEFAULT_SIGNUP_PASSWORD },
      newStudent: newStudentAPIData 
    };

  } catch (error: any) {
    console.error('Error in addStudentProcess:', error);
    return { success: false, messageKey: "alertMessage.app.addStudentFailure", replacements: {message: error.message || "An unknown error occurred." } };
  }
}

export async function deleteStudentAccount(userId: string): Promise<{ success: boolean; message: string }> {
  const token = getAdminToken();
  if (!token) {
    return { success: false, message: "Admin token not found." };
  }

  const deleteUserUrl = `${API_BASE_URL_USER}/v1/admin/student/delete-user-by-userid/${userId}`;
  try {
    const response = await fetch(deleteUserUrl, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json; charset=utf-8'
      }
    });
    const responseData: FselApiResponse<{}> = await response.json();

    if (!response.ok || !responseData.isOK) {
      // Check for specific error codes or messages if the API provides them
      // For example, if the API returns { "isOK": false, "errorMessages": ["User has active courses"] }
      const specificError = extractApiErrorMessage(responseData, "Failed to delete account.");
      return { success: false, message: specificError };
    }
    return { success: true, message: "Account deleted successfully." };
  } catch (error: any) {
    console.error('Error deleting student account:', error);
    return { success: false, message: error.message || "An unknown error occurred during account deletion." };
  }
}


// Helper to map StudentSearchResultItem to Student (if needed in App.tsx)
export function mapStudentSearchResultToStudent(item: StudentSearchResultItem): Student {
  return {
    id: item.id, 
    studentId: item.studentId, 
    studentCode: item.studentCode,
    fullName: item.fullName,
    phoneNumber: item.phoneNumber,
    email: item.email,
    birthday: item.birthday,
    schoolName: item.schoolName,
    class: item.class,
    status: item.status, 
    object: item.object, 
    // customerType: item.object, // Map 'object' to 'customerType' if needed by Student type
    type: item.type,
    gender: item.gender,
    courseLevel: item.courseLevel,
    schoolId: item.schoolId,
    grade: item.grade,
    userName: item.userName,
    passwordDefault: item.passwordDefault,
    event: item.event,
    courseId: item.courseId,
    provinceId: item.provinceId,
    districtId: item.districtId,
    expiredDate: item.expiredDate,
    totalLesson: item.totalLesson,
    totalLessonDone: item.totalLessonDone,
    emailConfirm: item.emailConfirm,
    isDeleted: item.isDeleted,
    createdUserId: item.createdUserId,
    updatedUserId: item.updatedUserId,
    createdFullName: item.createdFullName,
    updatedFullName: item.updatedFullName,
    createdDate: item.createdDate,
    updatedDate: item.updatedDate,
  };
}
