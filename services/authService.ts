
import { API_BASE_URL_AUTH } from '../constants';
import { FselApiResponse } from '../types';

const TOKEN_KEY = 'admin_token';
const TOKEN_TIMESTAMP_KEY = 'admin_token_timestamp';

interface AuthResponse {
  accessToken: string;
  // other fields if necessary
}

export async function ensureAdminToken(): Promise<string | null> {
  let existingToken = localStorage.getItem(TOKEN_KEY);
  const tokenTimestamp = localStorage.getItem(TOKEN_TIMESTAMP_KEY);
  let shouldFetchNewToken = true;

  if (existingToken && tokenTimestamp) {
    const lastFetchTime = parseInt(tokenTimestamp, 10);
    const lastFetchDateObj = new Date(lastFetchTime);
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    if (lastFetchDateObj.getTime() >= todayStart.getTime()) {
      shouldFetchNewToken = false;
    } else {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(TOKEN_TIMESTAMP_KEY);
      existingToken = null;
    }
  } else if (existingToken && !tokenTimestamp) {
    localStorage.removeItem(TOKEN_KEY);
    existingToken = null;
  }

  if (shouldFetchNewToken) {
    console.log('Admin token not found or expired. Fetching new token...');
    try {
      const response = await fetch(`${API_BASE_URL_AUTH}/v1/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          username: "viettrung@atlantic.edu.vn", // Hardcoded as in original script
          password: "Vani8182611!@", // Hardcoded as in original script
          isPersisMission: true,
          platformCode: "LMSAdmin"
        })
      });

      const responseData: FselApiResponse<AuthResponse> = await response.json();

      // DEBUG: Log the full responseData from the token API
      console.log('DEBUG: API Response Data for Admin Token:', JSON.stringify(responseData, null, 2));

      if (!response.ok || !responseData.isOK || !responseData.result?.accessToken) {
        console.error('Error fetching admin token:', response.status, responseData);
        throw new Error(responseData.errorMessages?.join(', ') || `API request failed with status ${response.status}`);
      }
      
      const newToken = responseData.result.accessToken;
      localStorage.setItem(TOKEN_KEY, newToken);
      localStorage.setItem(TOKEN_TIMESTAMP_KEY, new Date().getTime().toString());
      console.log('Admin token fetched and stored successfully.');
      return newToken;
    } catch (error) {
      console.error('Error during admin token fetch/store process:', error);
      return null;
    }
  }
  return existingToken;
}

export function getAdminToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}
