import type { User, DayPlan, MealFeedback } from '../types';

const KEY = 'mealplanner_v1';

interface StoredData {
  users: Record<string, User>;
  plans: Record<string, Record<string, Record<string, DayPlan>>>;
  feedback: Record<string, Record<string, MealFeedback>>;
  currentUserId: string | null;
}

function load(): StoredData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StoredData;
  } catch { /* ignore */ }
  return { users: {}, plans: {}, feedback: {}, currentUserId: null };
}

function save(data: StoredData): void {
  localStorage.setItem(KEY, JSON.stringify(data));
}

// ── Users ────────────────────────────────────────────────────────────────────

export function getUsers(): Record<string, User> {
  return load().users;
}

export function saveUser(user: User): void {
  const data = load();
  data.users[user.id] = user;
  save(data);
}

export function getCurrentUserId(): string | null {
  return load().currentUserId;
}

export function setCurrentUserId(id: string | null): void {
  const data = load();
  data.currentUserId = id;
  save(data);
}

// ── Plans ────────────────────────────────────────────────────────────────────

export function getWeekPlan(userId: string, weekStart: string): Record<string, DayPlan> {
  return load().plans[userId]?.[weekStart] ?? {};
}

export function saveDayMeal(
  userId: string,
  weekStart: string,
  date: string,
  slot: 'lunch' | 'dinner',
  meal: import('../types').Meal,
): void {
  const data = load();
  data.plans[userId] ??= {};
  data.plans[userId][weekStart] ??= {};
  const existing = data.plans[userId][weekStart][date] ?? { date };
  data.plans[userId][weekStart][date] = { ...existing, [slot]: meal };
  save(data);
}

export function deleteDayMeal(
  userId: string,
  weekStart: string,
  date: string,
  slot: 'lunch' | 'dinner',
): void {
  const data = load();
  if (data.plans[userId]?.[weekStart]?.[date]) {
    const day = { ...data.plans[userId][weekStart][date] };
    delete day[slot];
    data.plans[userId][weekStart][date] = day;
    save(data);
  }
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export function getMealFeedback(userId: string, mealId: string): MealFeedback | null {
  return load().feedback[userId]?.[mealId] ?? null;
}

export function setMealFeedback(userId: string, feedback: MealFeedback): void {
  const data = load();
  data.feedback[userId] ??= {};
  data.feedback[userId][feedback.mealId] = feedback;
  save(data);
}

export function getAllFeedback(userId: string): Record<string, MealFeedback> {
  return load().feedback[userId] ?? {};
}
