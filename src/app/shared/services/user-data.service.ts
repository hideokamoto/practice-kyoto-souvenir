import { Injectable } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';

export interface Favorite {
  itemId: string;
  itemType: 'sight' | 'souvenir';
  addedAt: string;
}

export interface Visit {
  itemId: string;
  itemType: 'sight' | 'souvenir';
  visitedAt: string;
  memo?: string;
}

export interface PlanItem {
  itemId: string;
  itemType: 'sight' | 'souvenir';
  order: number;
}

export interface Plan {
  id: string;
  name: string;
  items: PlanItem[];
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserDataService {
  private readonly FAVORITES_KEY = 'kyoto-favorites';
  private readonly VISITS_KEY = 'kyoto-visits';
  private readonly PLANS_KEY = 'kyoto-plans';
  private readonly ONBOARDING_KEY = 'kyoto-onboarding-completed';

  constructor() {}

  // ==================== お気に入り関連 ====================

  getFavorites(): Favorite[] {
    const data = localStorage.getItem(this.FAVORITES_KEY);
    return data ? JSON.parse(data) : [];
  }

  isFavorite(itemId: string, itemType: 'sight' | 'souvenir'): boolean {
    const favorites = this.getFavorites();
    return favorites.some(f => f.itemId === itemId && f.itemType === itemType);
  }

  addFavorite(itemId: string, itemType: 'sight' | 'souvenir'): void {
    const favorites = this.getFavorites();
    if (!this.isFavorite(itemId, itemType)) {
      favorites.push({
        itemId,
        itemType,
        addedAt: new Date().toISOString()
      });
      localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
    }
  }

  removeFavorite(itemId: string, itemType: 'sight' | 'souvenir'): void {
    let favorites = this.getFavorites();
    favorites = favorites.filter(f => !(f.itemId === itemId && f.itemType === itemType));
    localStorage.setItem(this.FAVORITES_KEY, JSON.stringify(favorites));
  }

  toggleFavorite(itemId: string, itemType: 'sight' | 'souvenir'): boolean {
    if (this.isFavorite(itemId, itemType)) {
      this.removeFavorite(itemId, itemType);
      return false;
    } else {
      this.addFavorite(itemId, itemType);
      return true;
    }
  }

  // ==================== 訪問済み関連 ====================

  getVisits(): Visit[] {
    const data = localStorage.getItem(this.VISITS_KEY);
    return data ? JSON.parse(data) : [];
  }

  isVisited(itemId: string, itemType: 'sight' | 'souvenir'): boolean {
    const visits = this.getVisits();
    return visits.some(v => v.itemId === itemId && v.itemType === itemType);
  }

  getVisit(itemId: string, itemType: 'sight' | 'souvenir'): Visit | undefined {
    const visits = this.getVisits();
    return visits.find(v => v.itemId === itemId && v.itemType === itemType);
  }

  addVisit(itemId: string, itemType: 'sight' | 'souvenir', memo?: string): void {
    const visits = this.getVisits();
    const existingIndex = visits.findIndex(v => v.itemId === itemId && v.itemType === itemType);

    const visit: Visit = {
      itemId,
      itemType,
      visitedAt: new Date().toISOString(),
      memo
    };

    if (existingIndex >= 0) {
      visits[existingIndex] = visit;
    } else {
      visits.push(visit);
    }

    localStorage.setItem(this.VISITS_KEY, JSON.stringify(visits));
  }

  removeVisit(itemId: string, itemType: 'sight' | 'souvenir'): void {
    let visits = this.getVisits();
    visits = visits.filter(v => !(v.itemId === itemId && v.itemType === itemType));
    localStorage.setItem(this.VISITS_KEY, JSON.stringify(visits));
  }

  toggleVisit(itemId: string, itemType: 'sight' | 'souvenir'): boolean {
    if (this.isVisited(itemId, itemType)) {
      this.removeVisit(itemId, itemType);
      return false;
    } else {
      this.addVisit(itemId, itemType);
      return true;
    }
  }

  // ==================== プラン関連 ====================

  getPlans(): Plan[] {
    const data = localStorage.getItem(this.PLANS_KEY);
    return data ? JSON.parse(data) : [];
  }

  getPlan(planId: string): Plan | undefined {
    const plans = this.getPlans();
    return plans.find(p => p.id === planId);
  }

  createPlan(name: string): Plan {
    const plans = this.getPlans();
    const newPlan: Plan = {
      id: this.generateId(),
      name,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    plans.push(newPlan);
    localStorage.setItem(this.PLANS_KEY, JSON.stringify(plans));
    return newPlan;
  }

  updatePlan(planId: string, updates: Partial<Plan>): void {
    const plans = this.getPlans();
    const index = plans.findIndex(p => p.id === planId);
    if (index >= 0) {
      plans[index] = {
        ...plans[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      localStorage.setItem(this.PLANS_KEY, JSON.stringify(plans));
    }
  }

  deletePlan(planId: string): void {
    let plans = this.getPlans();
    plans = plans.filter(p => p.id !== planId);
    localStorage.setItem(this.PLANS_KEY, JSON.stringify(plans));
  }

  addItemToPlan(planId: string, itemId: string, itemType: 'sight' | 'souvenir'): void {
    const plan = this.getPlan(planId);
    if (plan) {
      const exists = plan.items.some(item => item.itemId === itemId && item.itemType === itemType);
      if (!exists) {
        plan.items.push({
          itemId,
          itemType,
          order: plan.items.length
        });
        this.updatePlan(planId, { items: plan.items });
      }
    }
  }

  removeItemFromPlan(planId: string, itemId: string, itemType: 'sight' | 'souvenir'): void {
    const plan = this.getPlan(planId);
    if (plan) {
      plan.items = plan.items.filter(item => !(item.itemId === itemId && item.itemType === itemType));
      // 順序を再計算
      plan.items = plan.items.map((item, index) => ({ ...item, order: index }));
      this.updatePlan(planId, { items: plan.items });
    }
  }

  reorderPlanItems(planId: string, items: PlanItem[]): void {
    const plan = this.getPlan(planId);
    if (plan) {
      const reorderedItems = items.map((item, index) => ({ ...item, order: index }));
      this.updatePlan(planId, { items: reorderedItems });
    }
  }

  isItemInPlan(planId: string, itemId: string, itemType: 'sight' | 'souvenir'): boolean {
    const plan = this.getPlan(planId);
    if (!plan) return false;
    return plan.items.some(item => item.itemId === itemId && item.itemType === itemType);
  }

  // ==================== ユーティリティ ====================

  private generateId(): string {
    return uuidv4();
  }

  // 統計情報取得
  getStats() {
    return {
      totalFavorites: this.getFavorites().length,
      totalVisits: this.getVisits().length,
      totalPlans: this.getPlans().length,
      visitedSights: this.getVisits().filter(v => v.itemType === 'sight').length,
      visitedSouvenirs: this.getVisits().filter(v => v.itemType === 'souvenir').length
    };
  }

  // ==================== オンボーディング関連 ====================

  isOnboardingCompleted(): boolean {
    return localStorage.getItem(this.ONBOARDING_KEY) === 'true';
  }

  completeOnboarding(): void {
    localStorage.setItem(this.ONBOARDING_KEY, 'true');
  }

  resetOnboarding(): void {
    localStorage.removeItem(this.ONBOARDING_KEY);
  }

  // データのクリア（デバッグ用）
  clearAllData(): void {
    localStorage.removeItem(this.FAVORITES_KEY);
    localStorage.removeItem(this.VISITS_KEY);
    localStorage.removeItem(this.PLANS_KEY);
    localStorage.removeItem(this.ONBOARDING_KEY);
  }
}
