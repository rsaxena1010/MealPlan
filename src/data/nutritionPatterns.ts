export interface NutritionPattern {
  keywords: string[];
  nutrition: { calories: number; protein: number; carbs: number; fat: number };
  cookTime: string;
  mealType: string;
}

export const NUTRITION_PATTERNS: NutritionPattern[] = [
  {
    keywords: ['biryani'],
    nutrition: { calories: 480, protein: 28, carbs: 52, fat: 18 },
    cookTime: '60 mins',
    mealType: 'rice & protein',
  },
  {
    keywords: ['chicken', 'murgh', 'murg'],
    nutrition: { calories: 340, protein: 32, carbs: 12, fat: 18 },
    cookTime: '35 mins',
    mealType: 'chicken',
  },
  {
    keywords: ['lamb', 'mutton', 'gosht', 'keema'],
    nutrition: { calories: 420, protein: 30, carbs: 10, fat: 28 },
    cookTime: '50 mins',
    mealType: 'lamb',
  },
  {
    keywords: ['paneer'],
    nutrition: { calories: 350, protein: 22, carbs: 16, fat: 22 },
    cookTime: '30 mins',
    mealType: 'paneer',
  },
  {
    keywords: ['dal', 'dhal', 'lentil', 'tarka', 'tadka', 'moong', 'masoor', 'toor', 'urad'],
    nutrition: { calories: 240, protein: 16, carbs: 32, fat: 6 },
    cookTime: '35 mins',
    mealType: 'lentils',
  },
  {
    keywords: ['chole', 'chickpea', 'channa'],
    nutrition: { calories: 290, protein: 15, carbs: 42, fat: 8 },
    cookTime: '40 mins',
    mealType: 'chickpeas',
  },
  {
    keywords: ['rajma', 'kidney bean'],
    nutrition: { calories: 300, protein: 16, carbs: 44, fat: 7 },
    cookTime: '45 mins',
    mealType: 'kidney beans',
  },
  {
    keywords: ['egg', 'anda'],
    nutrition: { calories: 280, protein: 20, carbs: 12, fat: 18 },
    cookTime: '20 mins',
    mealType: 'eggs',
  },
  {
    keywords: ['fish', 'prawn', 'shrimp', 'seafood', 'macher', 'machli'],
    nutrition: { calories: 290, protein: 28, carbs: 12, fat: 14 },
    cookTime: '30 mins',
    mealType: 'seafood',
  },
  {
    keywords: ['kebab', 'tikka', 'seekh', 'tandoori'],
    nutrition: { calories: 320, protein: 30, carbs: 8, fat: 18 },
    cookTime: '40 mins',
    mealType: 'grilled',
  },
  {
    keywords: ['soya', 'soy chunk'],
    nutrition: { calories: 280, protein: 26, carbs: 18, fat: 8 },
    cookTime: '25 mins',
    mealType: 'soya',
  },
  {
    keywords: ['palak', 'spinach'],
    nutrition: { calories: 310, protein: 18, carbs: 18, fat: 20 },
    cookTime: '25 mins',
    mealType: 'greens',
  },
  // Default fallback - must be last
  {
    keywords: [],
    nutrition: { calories: 280, protein: 15, carbs: 30, fat: 10 },
    cookTime: '30 mins',
    mealType: 'Indian',
  },
];
