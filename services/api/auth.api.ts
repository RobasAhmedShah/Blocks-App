import Constants from 'expo-constants';

// Backend runs on port 3001 locally (see Blocks-Backend src/main.ts)
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3001';

export interface LoginDto {
  email: string;
  password: string;
  expoToken?: string;
  webPushSubscription?: any;
}

export interface GoogleLoginDto {
  idToken: string;
  expoToken?: string;
  webPushSubscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

export interface RegisterDto {
  email: string;
  /** Optional for mobile (OTP + PIN device unlock). */
  password?: string;
  fullName: string;
  phone?: string;
  expoToken?: string;
  webPushSubscription?: any;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    fullName: string;
    phone?: string;
    role: string;
    isActive: boolean;
    displayCode: string;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
}

export interface RefreshTokenDto {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface WalletConnectDto {
  walletAddress: string;
  expoToken?: string;
  webPushSubscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

export interface WalletAuthResponse {
  user: {
    id: string;
    walletAddress?: string | null;
    displayCode: string;
    fullName: string;
    email: string;
    customerTypeEnum: 'kyc' | 'nonkyc';
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
  };
  token: string;
  refreshToken: string;
  isNewUser: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  displayCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface OtpRequestDto {
  email: string;
}

export interface OtpVerifyDto {
  email: string;
  otp: string;
  expoToken?: string;
  webPushSubscription?: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
}

export interface OtpResponse {
  message: string;
}

/** Returned when OTP is valid but user does not exist; app should redirect to signup. */
export interface OtpVerifiedNewUserResponse {
  verified: true;
  email: string;
  existingUser: false;
}

export type OtpVerifyResponse = AuthResponse | OtpVerifiedNewUserResponse;

// Public API client for auth endpoints (no token required)
async function publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  console.log(`[API] Making request to: ${API_BASE_URL}${endpoint}`);
  
  // Add timeout to prevent hanging
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    console.log(`[API] Response status: ${response.status} for ${endpoint}`);

    if (!response.ok) {
      const errorText = await response.text();
      let error;
      try {
        error = JSON.parse(errorText);
      } catch {
        error = { message: errorText || `HTTP ${response.status}` };
      }
      console.error(`[API] Error response:`, error);
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API] Success response for ${endpoint}`);
    return data;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.error(`[API] Request timeout for ${endpoint}`);
      throw new Error(`Request timeout: The server did not respond within 15 seconds. Please check if the backend server is running.`);
    }
    console.error(`[API] Request failed for ${endpoint}:`, error);
    throw error;
  }
}

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    return publicRequest<AuthResponse>('/api/mobile/auth/login', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  googleLogin: async (dto: GoogleLoginDto): Promise<AuthResponse> => {
    return publicRequest<AuthResponse>('/api/mobile/auth/google', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  register: async (dto: RegisterDto): Promise<AuthResponse> => {
    return publicRequest<AuthResponse>('/api/mobile/auth/register', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  refreshToken: async (refreshToken: string): Promise<RefreshTokenResponse> => {
    return publicRequest<RefreshTokenResponse>('/api/mobile/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    });
  },

  logout: async (token: string): Promise<{ message: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/mobile/auth/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  getMe: async (token: string): Promise<User> => {
    const response = await fetch(`${API_BASE_URL}/api/mobile/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error('Authentication required. Please login again.');
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  },

  checkEmail: async (email: string): Promise<{ exists: boolean }> => {
    return publicRequest<{ exists: boolean }>(`/api/mobile/auth/check-email?email=${encodeURIComponent(email)}`, {
      method: 'GET',
    });
  },

  // Wallet-only authentication (no KYC required)
  walletConnect: async (dto: WalletConnectDto): Promise<WalletAuthResponse> => {
    return publicRequest<WalletAuthResponse>('/api/mobile/wallet-auth/connect', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  // OTP Authentication
  requestOtp: async (dto: OtpRequestDto): Promise<OtpResponse> => {
    return publicRequest<OtpResponse>('/api/mobile/auth/otp/request', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },

  verifyOtp: async (dto: OtpVerifyDto): Promise<OtpVerifyResponse> => {
    return publicRequest<OtpVerifyResponse>('/api/mobile/auth/otp/verify', {
      method: 'POST',
      body: JSON.stringify(dto),
    });
  },
};

