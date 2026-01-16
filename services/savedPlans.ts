import * as SecureStore from 'expo-secure-store';

const SAVED_PLANS_KEY = 'saved_investment_plans';

export interface SavedPlan {
  id: string;
  investmentAmount: number;
  monthlyIncomeGoal?: number;
  selectedProperty?: {
    id: string;
    title: string;
    location?: string;
    image?: string;
  };
  selectedPropertyTokenId?: string; // ID of the selected property token
  expectedMonthlyReturn?: number;
  estimatedROI?: number;
  isGoalBased?: boolean;
  createdAt: string;
  updatedAt: string;
}

export const savedPlansService = {
  // Get all saved plans
  async getAllPlans(): Promise<SavedPlan[]> {
    try {
      const plansJson = await SecureStore.getItemAsync(SAVED_PLANS_KEY);
      if (!plansJson) return [];
      return JSON.parse(plansJson);
    } catch (error) {
      console.error('Error loading saved plans:', error);
      return [];
    }
  },

  // Save a new plan
  async savePlan(plan: Omit<SavedPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedPlan> {
    try {
      const existingPlans = await this.getAllPlans();
      const newPlan: SavedPlan = {
        ...plan,
        id: `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      
      const updatedPlans = [newPlan, ...existingPlans];
      await SecureStore.setItemAsync(SAVED_PLANS_KEY, JSON.stringify(updatedPlans));
      return newPlan;
    } catch (error) {
      console.error('Error saving plan:', error);
      throw error;
    }
  },

  // Delete a plan
  async deletePlan(planId: string): Promise<void> {
    try {
      const existingPlans = await this.getAllPlans();
      const updatedPlans = existingPlans.filter(p => p.id !== planId);
      await SecureStore.setItemAsync(SAVED_PLANS_KEY, JSON.stringify(updatedPlans));
    } catch (error) {
      console.error('Error deleting plan:', error);
      throw error;
    }
  },

  // Clear all plans
  async clearAllPlans(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SAVED_PLANS_KEY);
    } catch (error) {
      console.error('Error clearing plans:', error);
      throw error;
    }
  },
};

