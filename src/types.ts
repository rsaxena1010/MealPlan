export interface Nutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface Meal {
  id: string;
  name: string;
  description: string;
  ingredients: string[];
  cookTime: string;
  servingSize: string;
  nutrition: Nutrition;
  instructions: string[];
  thumbnail?: string;
  tags?: string[];
}

export interface PantryItem {
  category: string;
  items: string[];
}

export interface MealSuggestions {
  lunch: Meal[];
  dinner: Meal[];
  pantryItems?: PantryItem[];
}

export interface TargetNutrition {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}
