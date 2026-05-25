import type { Meal } from '../types';
import { NUTRITION_PATTERNS } from '../data/nutritionPatterns';
import { FALLBACK_MEALS } from '../data/fallbackMeals';

// ── Types ────────────────────────────────────────────────────────────────────

interface MealDbListItem {
  idMeal: string;
  strMeal: string;
  strMealThumb: string;
}

interface MealDbDetail {
  idMeal: string;
  strMeal: string;
  strCategory: string;
  strInstructions: string;
  strMealThumb: string;
  [key: string]: string;
}

// ── In-memory cache ───────────────────────────────────────────────────────────

let cachedMeals: Meal[] | null = null;

// ── Nutrition estimation ──────────────────────────────────────────────────────

function estimateNutrition(name: string, ingredients: string[]): {
  nutrition: Meal['nutrition'];
  cookTime: string;
} {
  const haystack = [name, ...ingredients].join(' ').toLowerCase();

  for (const pattern of NUTRITION_PATTERNS) {
    if (pattern.keywords.length === 0) {
      // Default fallback pattern
      return { nutrition: { ...pattern.nutrition }, cookTime: pattern.cookTime };
    }
    if (pattern.keywords.some(kw => haystack.includes(kw))) {
      return { nutrition: { ...pattern.nutrition }, cookTime: pattern.cookTime };
    }
  }

  // Should not reach here since last pattern is default, but just in case
  return {
    nutrition: { calories: 280, protein: 15, carbs: 30, fat: 10 },
    cookTime: '30 mins',
  };
}

// ── Ingredient extraction ─────────────────────────────────────────────────────

function extractIngredients(detail: MealDbDetail): string[] {
  const ingredients: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const name = detail[`strIngredient${i}`]?.trim();
    const measure = detail[`strMeasure${i}`]?.trim();
    if (name) {
      ingredients.push(measure ? `${measure} ${name}` : name);
    }
  }
  return ingredients;
}

// ── Instruction parsing ───────────────────────────────────────────────────────

function parseInstructions(raw: string): string[] {
  const steps = raw
    .split(/\r?\n/)
    .map(s => s.trim())
    .filter(s => s.length > 10);

  if (steps.length >= 3) return steps;

  // Fallback: split on sentences
  return raw
    .split(/\.\s+/)
    .map(s => s.trim().replace(/\.$/, ''))
    .filter(s => s.length > 10)
    .map(s => `${s}.`);
}

// ── API fetching ──────────────────────────────────────────────────────────────

async function fetchMealList(): Promise<MealDbListItem[]> {
  const res = await fetch('https://www.themealdb.com/api/json/v1/1/filter.php?a=Indian');
  if (!res.ok) throw new Error(`MealDB list fetch failed: ${res.status}`);
  const data = await res.json() as { meals: MealDbListItem[] | null };
  return data.meals ?? [];
}

async function fetchMealDetail(id: string): Promise<MealDbDetail | null> {
  const res = await fetch(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
  if (!res.ok) return null;
  const data = await res.json() as { meals: MealDbDetail[] | null };
  return data.meals?.[0] ?? null;
}

async function batchFetch(ids: string[]): Promise<MealDbDetail[]> {
  const results: MealDbDetail[] = [];
  const BATCH_SIZE = 5;

  for (let i = 0; i < ids.length; i += BATCH_SIZE) {
    const batch = ids.slice(i, i + BATCH_SIZE);
    const settled = await Promise.allSettled(batch.map(id => fetchMealDetail(id)));
    for (const result of settled) {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    }
  }

  return results;
}

// ── Main database loader ──────────────────────────────────────────────────────

export async function loadMealDatabase(): Promise<Meal[]> {
  if (cachedMeals) return cachedMeals;

  try {
    const list = await fetchMealList();
    const ids = list.map(m => m.idMeal);
    const details = await batchFetch(ids);

    const thumbMap = new Map<string, string>(list.map(m => [m.idMeal, m.strMealThumb]));

    const apiMeals: Meal[] = details
      .map((detail): Meal | null => {
        const ingredients = extractIngredients(detail);
        const { nutrition, cookTime } = estimateNutrition(detail.strMeal, ingredients);

        if (nutrition.protein < 15) return null;

        const instructions = parseInstructions(detail.strInstructions);
        if (instructions.length < 2) return null;

        return {
          id: `mealdb-${detail.idMeal}`,
          name: detail.strMeal,
          description: `${detail.strCategory} dish from TheMealDB — a flavourful Indian recipe.`,
          ingredients,
          cookTime,
          servingSize: '2 servings',
          nutrition,
          instructions,
          thumbnail: thumbMap.get(detail.idMeal),
          tags: [detail.strCategory.toLowerCase(), 'indian'],
        };
      })
      .filter((m): m is Meal => m !== null);

    // Merge API meals with fallback meals (API takes priority; deduplicate by name)
    const apiNames = new Set(apiMeals.map(m => m.name.toLowerCase()));
    const uniqueFallbacks = FALLBACK_MEALS.filter(
      m => !apiNames.has(m.name.toLowerCase())
    );

    cachedMeals = [...apiMeals, ...uniqueFallbacks];
  } catch {
    // API unavailable — use local fallback only
    cachedMeals = [...FALLBACK_MEALS];
  }

  return cachedMeals;
}

// ── Filtering ─────────────────────────────────────────────────────────────────

export function filterByIngredients(
  meals: Meal[],
  userIngredients: string,
  feedback?: Record<string, 'up' | 'down'>,
): Meal[] {
  const tokens = userIngredients
    .split(/[\n,]+/)
    .map(s => s.trim().toLowerCase())
    .filter(s => s.length > 1);

  if (tokens.length === 0) return meals;

  const scored = meals.map(meal => {
    const nameLower = meal.name.toLowerCase();
    const ingredientText = meal.ingredients.join(' ').toLowerCase();

    // Name matches are worth 5× more — "chicken" in "Chicken Curry" beats
    // a meal that merely uses chicken broth or yogurt
    const nameScore = tokens.filter(t => nameLower.includes(t)).length * 5;
    const ingScore = tokens.filter(t => ingredientText.includes(t)).length;
    let score = nameScore + ingScore;

    // Apply user feedback: boost liked meals, strongly suppress disliked
    const fb = feedback?.[meal.id];
    if (fb === 'up') score *= 1.5;
    if (fb === 'down') score *= 0.1;

    return { meal, score };
  });

  return scored
    .filter(({ score }) => score > 0.1)
    .sort((a, b) => b.score - a.score)
    .map(({ meal }) => meal);
}

// ── Lunch / Dinner split ──────────────────────────────────────────────────────

export function splitLunchDinner(meals: Meal[]): { lunch: Meal[]; dinner: Meal[] } {
  const LUNCH_KEYWORDS = ['dal', 'lentil', 'egg', 'anda', 'sabzi', 'chole', 'rajma', 'chana', 'moong', 'sprout', 'bhurji', 'chilla'];
  const DINNER_KEYWORDS = ['biryani', 'pulao', 'lamb', 'mutton', 'gosht', 'kebab', 'tikka', 'rogan', 'keema'];

  const score = (meal: Meal, keywords: string[]) => {
    const haystack = (meal.name + ' ' + (meal.tags?.join(' ') ?? '')).toLowerCase();
    return keywords.filter(kw => haystack.includes(kw)).length;
  };

  const lunchCandidates = meals.filter(m => score(m, LUNCH_KEYWORDS) > 0);
  const dinnerCandidates = meals.filter(m => score(m, DINNER_KEYWORDS) > 0);
  const neutralMeals = meals.filter(
    m => score(m, LUNCH_KEYWORDS) === 0 && score(m, DINNER_KEYWORDS) === 0
  );

  const lunch: Meal[] = lunchCandidates.slice(0, 2);
  const dinner: Meal[] = dinnerCandidates.slice(0, 2);

  // Fill from neutral pool if needed
  let neutralIdx = 0;
  while (lunch.length < 2 && neutralIdx < neutralMeals.length) {
    const candidate = neutralMeals[neutralIdx++];
    if (!dinner.includes(candidate)) lunch.push(candidate);
  }
  neutralIdx = 0;
  while (dinner.length < 2 && neutralIdx < neutralMeals.length) {
    const candidate = neutralMeals[neutralIdx++];
    if (!lunch.includes(candidate)) dinner.push(candidate);
  }

  // Last resort: fill from opposite category if still short
  if (lunch.length < 2) {
    for (const m of dinnerCandidates) {
      if (!lunch.includes(m) && !dinner.includes(m)) {
        lunch.push(m);
        if (lunch.length === 2) break;
      }
    }
  }
  if (dinner.length < 2) {
    for (const m of lunchCandidates) {
      if (!dinner.includes(m) && !lunch.includes(m)) {
        dinner.push(m);
        if (dinner.length === 2) break;
      }
    }
  }

  return { lunch, dinner };
}
