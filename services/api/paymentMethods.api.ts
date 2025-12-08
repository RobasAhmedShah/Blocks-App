import { apiClient } from './apiClient';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'crypto';
  provider: string;
  status: 'pending' | 'verified' | 'disabled';
  isDefault: boolean;
  createdAt: string;
  cardDetails?: {
    cardNumber: string; // Masked
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cardType: string;
    cardCategory: string;
  };
}

export interface CreatePaymentMethodDto {
  type: 'card' | 'bank' | 'crypto';
  provider: string;
  isDefault?: boolean;
  cardDetails?: {
    cardNumber: string;
    cardholderName: string;
    expiryMonth: string;
    expiryYear: string;
    cvv: string;
    cardType: string;
    cardCategory: string;
    billingAddress: string;
    billingCity: string;
    billingState: string;
    billingPostalCode: string;
    billingCountry: string;
    issuingBank?: string;
    bankCode?: string;
  };
}

export const paymentMethodsApi = {
  getPaymentMethods: async (): Promise<PaymentMethod[]> => {
    return apiClient.get<PaymentMethod[]>('/api/mobile/payment-methods');
  },

  getPaymentMethod: async (id: string): Promise<PaymentMethod> => {
    return apiClient.get<PaymentMethod>(`/api/mobile/payment-methods/${id}`);
  },

  createPaymentMethod: async (dto: CreatePaymentMethodDto): Promise<PaymentMethod> => {
    return apiClient.post<PaymentMethod>('/api/mobile/payment-methods', dto);
  },

  verifyPaymentMethod: async (id: string, status: 'verified' | 'disabled'): Promise<PaymentMethod> => {
    return apiClient.patch<PaymentMethod>(`/api/mobile/payment-methods/${id}/verify`, { status });
  },

  setDefaultPaymentMethod: async (id: string, isDefault: boolean): Promise<PaymentMethod> => {
    return apiClient.patch<PaymentMethod>(`/api/mobile/payment-methods/${id}/default`, { isDefault });
  },

  deletePaymentMethod: async (id: string): Promise<void> => {
    return apiClient.delete<void>(`/api/mobile/payment-methods/${id}`);
  },
};

