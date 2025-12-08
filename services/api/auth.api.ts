import Constants from 'expo-constants';

const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

export interface LoginDto {
  email: string;
  password: string;
  expoToken?: string;
  webPushSubscription?: any;
}

export interface RegisterDto {
  email: string;
  password: string;
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

// Public API client for auth endpoints (no token required)
async function publicRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP ${response.status}`);
  }

  return response.json();
}

export const authApi = {
  login: async (dto: LoginDto): Promise<AuthResponse> => {
    return publicRequest<AuthResponse>('/api/mobile/auth/login', {
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
};

