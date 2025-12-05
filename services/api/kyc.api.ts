import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import * as FileSystem from 'expo-file-system/legacy';

const TOKEN_KEY = 'auth_token';
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export interface KycStatus {
  id?: string;
  type?: 'cnic' | 'passport' | 'license' | 'other';
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  hasDocuments?: {
    front: boolean;
    back: boolean;
    selfie: boolean;
  };
  message?: string;
}

export interface KycDetails {
  id: string;
  type: 'cnic' | 'passport' | 'license' | 'other';
  status: 'pending' | 'verified' | 'rejected';
  documents: {
    front?: string;
    back?: string;
    selfie?: string;
  };
  reviewer?: string;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UploadDocumentResponse {
  success: boolean;
  documentType: string;
  url: string;
  path: string;
}

export interface SubmitKycDto {
  type: 'cnic' | 'passport' | 'license' | 'other';
  documentFrontUrl: string;
  documentBackUrl?: string;
  selfieUrl?: string;
  metadata?: any;
}

export interface SubmitKycResponse {
  success: boolean;
  message: string;
  kyc: {
    id: string;
    type: string;
    status: string;
    submittedAt: string;
  };
}

async function getAuthToken(): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
}

async function uploadFile(
  endpoint: string,
  fileUri: string,
  documentType: 'front' | 'back' | 'selfie'
): Promise<UploadDocumentResponse> {
  const token = await getAuthToken();
  if (!token) {
    throw new Error('Authentication required. Please login again.');
  }

  const fullUrl = `${API_BASE_URL}${endpoint}`;
  console.log('Uploading to:', fullUrl);
  console.log('File URI:', fileUri);

  try {
    const fileName = fileUri.split('/').pop() || `${documentType}.jpg`;
    const fileExtension = fileName.split('.').pop()?.toLowerCase();
    const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';

    console.log('Preparing upload:', { fileName, mimeType, documentType });
    console.log('Reading file as base64...');
    
    // Read file as base64 - we'll send it as JSON instead of FormData
    // because React Native FormData with data URIs doesn't work with Fastify multipart parser
    const base64 = await FileSystem.readAsStringAsync(fileUri, {
      encoding: 'base64',
    });

    console.log('File read successfully, size:', base64.length, 'characters');

    // Send as JSON instead of FormData - more reliable for React Native
    const requestBody = {
      fileData: base64, // Base64 string
      fileName: fileName,
      mimeType: mimeType,
      documentType: documentType,
    };

    console.log('Sending JSON request with base64 file data...');

    // Use fetch with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout

    try {
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      console.log('Upload response status:', response.status, response.statusText);

      if (response.status === 401) {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        throw new Error('Authentication required. Please login again.');
      }

      if (!response.ok) {
        let errorMessage = 'Upload failed';
        try {
          const errorText = await response.text();
          console.error('Upload error response:', errorText);
          try {
            const errorJson = JSON.parse(errorText);
            errorMessage = errorJson.message || errorJson.error || errorText;
          } catch {
            errorMessage = errorText || `HTTP ${response.status}`;
          }
        } catch (parseError) {
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Upload successful:', result);
      return result;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      if (fetchError.name === 'AbortError') {
        throw new Error('Upload timeout. Please check your connection and try again.');
      }
      throw fetchError;
    }
  } catch (error) {
    console.error('Upload error:', error);
    
    // Check if it's a network error
    if (error instanceof TypeError) {
      if (error.message.includes('Network request failed') || error.message.includes('Failed to fetch')) {
        throw new Error(
          `Cannot connect to server at ${API_BASE_URL}. ` +
          `Please check:\n` +
          `1. Backend is running on port 3000\n` +
          `2. Your device can reach ${API_BASE_URL}\n` +
          `3. Your internet connection is working`
        );
      }
    }
    
    throw error;
  }
}

export const kycApi = {
  /**
   * Get current user's KYC status
   */
  getStatus: async (): Promise<KycStatus> => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await fetch(`${API_BASE_URL}/api/mobile/kyc/status`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      throw new Error('Authentication required. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  /**
   * Get full KYC details
   */
  getKyc: async (): Promise<KycDetails | null> => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await fetch(`${API_BASE_URL}/api/mobile/kyc`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      throw new Error('Authentication required. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    return data || null;
  },

  /**
   * Upload KYC document (front, back, or selfie)
   */
  uploadDocument: async (
    fileUri: string,
    documentType: 'front' | 'back' | 'selfie'
  ): Promise<UploadDocumentResponse> => {
    return uploadFile('/api/mobile/kyc/upload-document', fileUri, documentType);
  },

  /**
   * Submit KYC verification
   */
  submitKyc: async (dto: SubmitKycDto): Promise<SubmitKycResponse> => {
    const token = await getAuthToken();
    if (!token) {
      throw new Error('Authentication required. Please login again.');
    }

    const response = await fetch(`${API_BASE_URL}/api/mobile/kyc/submit`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dto),
    });

    if (response.status === 401) {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      throw new Error('Authentication required. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Submission failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },
};

