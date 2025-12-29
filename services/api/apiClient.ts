import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_token';
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

class ApiClient {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async getAuthToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.getAuthToken();
    
    const headers: HeadersInit = {
      ...options.headers,
    };

    // Only set Content-Type for requests with a body
    if (options.body) {
      headers['Content-Type'] = 'application/json';
    }

    // Automatically add Authorization header if token exists
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const fullUrl = `${this.baseURL}${endpoint}`;
    
    // Log request for debugging (only in development)
    if (__DEV__) {
      console.log(`[API] ${options.method || 'GET'} ${fullUrl}`);
      if (options.body) {
        console.log(`[API] Body:`, options.body);
      }
    }

    const response = await fetch(fullUrl, {
      ...options,
      headers,
    });

    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Clear invalid token
      try {
        await SecureStore.deleteItemAsync(TOKEN_KEY);
      } catch (error) {
        console.error('Error clearing token:', error);
      }
      
      throw new Error('Authentication required. Please login again.');
    }

    if (!response.ok) {
      let errorMessage = `HTTP ${response.status}`;
      let errorDetails: any = {};
      
      try {
        const errorText = await response.text();
        if (__DEV__) {
          console.error(`[API] Error response (${response.status}):`, errorText);
        }
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorData.error || errorData.errorMessage || errorMessage;
          errorDetails = errorData;
        } catch {
          // If not JSON, use the text as error message
          errorMessage = errorText || response.statusText || errorMessage;
        }
      } catch {
        // If response is not JSON, use status text or default message
        errorMessage = response.statusText || errorMessage;
      }
      
      // Provide more context for 404/405 errors
      if (response.status === 404) {
        errorMessage = `Endpoint not found: ${endpoint}. Check if the route exists on the backend.`;
      } else if (response.status === 405) {
        errorMessage = `Method not allowed: ${options.method || 'GET'} ${endpoint}. The endpoint may not support this HTTP method.`;
      }
      
      const error = new Error(errorMessage);
      (error as any).status = response.status;
      (error as any).response = response;
      (error as any).details = errorDetails;
      throw error;
    }

    // Handle 204 No Content responses (common for DELETE requests)
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

