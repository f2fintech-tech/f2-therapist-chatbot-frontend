// Goals CRUD utility for localStorage persistence.

const GOALS_STORAGE_KEY = "finheal_user_goals";
const GOALS_UPDATED_EVENT = "finheal:goals-updated";

export interface Goal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  currency: string;
  color: string;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

function _readGoalsStore(): Goal[] {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as Goal[];
  } catch {
    return [];
  }
}

function _writeGoalsStore(goals: Goal[]) {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(GOALS_UPDATED_EVENT));
    }
  } catch {
    // ignore quota errors
  }
}

export function listUserGoals(userId: string): Goal[] {
  const allGoals = _readGoalsStore();
  return allGoals
    .filter((g) => g.userId === userId)
    .sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
}

export function createGoal(userId: string, name: string, targetAmount: number, currency: string = "₹", color: string = "var(--color-primary)", icon?: string): Goal {
  const goals = _readGoalsStore();
  const now = new Date().toISOString();
  const newGoal: Goal = {
    id: `goal-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    userId,
    name,
    targetAmount,
    currentAmount: 0,
    currency,
    color,
    icon,
    createdAt: now,
    updatedAt: now,
  };
  goals.push(newGoal);
  _writeGoalsStore(goals);
  return newGoal;
}

export function updateGoal(goalId: string, updates: Partial<Goal>): Goal | null {
  const goals = _readGoalsStore();
  const idx = goals.findIndex((g) => g.id === goalId);
  if (idx < 0) return null;

  const updated: Goal = {
    ...goals[idx],
    ...updates,
    id: goals[idx].id,
    userId: goals[idx].userId,
    createdAt: goals[idx].createdAt,
    updatedAt: new Date().toISOString(),
  };

  goals[idx] = updated;
  _writeGoalsStore(goals);
  return updated;
}

export function updateGoalProgress(goalId: string, currentAmount: number): Goal | null {
  return updateGoal(goalId, { currentAmount });
}

export function deleteGoal(goalId: string): boolean {
  let goals = _readGoalsStore();
  const originalLength = goals.length;
  goals = goals.filter((g) => g.id !== goalId);
  if (goals.length < originalLength) {
    _writeGoalsStore(goals);
    return true;
  }
  return false;
}

export function getGoalCompletionPercent(goal: Goal): number {
  if (goal.targetAmount <= 0) return 0;
  return Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
}
