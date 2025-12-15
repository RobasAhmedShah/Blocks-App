import { apiClient } from './apiClient';

export interface UserInfo {
  id: string;
  displayCode: string;
  email: string;
  fullName: string;
  phone?: string | null;
  dob?: string | null;
  address?: string | null;
  profileImage?: string | null;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  biometricLogin: boolean;
  passwordLastChanged: string | null;
}

export interface NotificationSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  investmentUpdates: boolean;
  propertyAlerts: boolean;
  monthlyReports: boolean;
  marketingOffers: boolean;
  securityAlerts: boolean;
  paymentReminders: boolean;
  portfolioMilestones: boolean;
  doNotDisturb: {
    enabled: boolean;
    startTime: string;
    endTime: string;
  };
}

export interface ProfileResponse {
  userInfo: UserInfo;
  securitySettings: SecuritySettings;
  notificationSettings: NotificationSettings;
}

export interface UpdateProfileDto {
  fullName?: string;
  email?: string;
  phone?: string;
  dob?: string;
  address?: string;
  profileImage?: string;
}

export interface UploadProfileImageResponse {
  success: boolean;
  message: string;
  url: string;
  path: string;
}

export const profileApi = {
  getProfile: async (): Promise<ProfileResponse> => {
    return apiClient.get<ProfileResponse>('/api/mobile/profile');
  },

  updateProfile: async (dto: UpdateProfileDto): Promise<ProfileResponse> => {
    return apiClient.patch<ProfileResponse>('/api/mobile/profile', dto);
  },

  uploadProfileImage: async (fileData: string, fileName: string, mimeType: string): Promise<UploadProfileImageResponse> => {
    return apiClient.post<UploadProfileImageResponse>('/api/mobile/profile/upload-image', {
      fileData,
      fileName,
      mimeType,
    });
  },
};

