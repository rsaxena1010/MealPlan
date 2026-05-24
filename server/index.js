import express from 'express';
import cors from 'cors';
import Anthropic from '@anthropic-ai/sdk';

const app = express();
app.use(cors());
app.use(express.json());

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are an expert Indian nutritionist and chef. You suggest simple, protein-rich Indian meals for lunch and dinner.

Always respond with valid JSON only — no markdown, no explanation, just the raw JSON object.

Meals must:
- Use common Indian ingredients and spices
- Be easy to prepare (under 45 minutes)
- Be protein-rich (at least 20g protein per serving)
- Include accurate nutritional info per serving

Nutritional values should be realistic and based on standard serving sizes.`;

const buildIngredientPrompt = (ingredients, targetNutrition) => {
  const nutritionText = targetNutrition
    ? `\nDaily nutrition targets per person: ${targetNutrition.calories} kcal, ${targetNutrition.protein}g protein, ${targetNutrition.carbs}g carbs, ${targetNutrition.fat}g fat`
    : '';

  return `I have these ingredients: ${ingredients}.${nutritionText}

Suggest 2 lunch options and 2 dinner options using primarily these ingredients (can assume basic pantry staples like oil, salt, common spices are available).

Respond with this exact JSON structure:
{
  "lunch": [
    {
      "name": "Meal Name",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "cookTime": "25 mins",
      "servingSize": "1 serving",
      "nutrition": { "calories": 450, "protein": 28, "carbs": 35, "fat": 12 },
      "instructions": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "dinner": [
    {
      "name": "Meal Name",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "cookTime": "30 mins",
      "servingSize": "1 serving",
      "nutrition": { "calories": 500, "protein": 32, "carbs": 40, "fat": 14 },
      "instructions": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}`;
};

const buildPantryPrompt = (targetNutrition) => {
  const nutritionText = targetNutrition
    ? `\nDaily nutrition targets per person: ${targetNutrition.calories} kcal, ${targetNutrition.protein}g protein, ${targetNutrition.carbs}g carbs, ${targetNutrition.fat}g fat`
    : '';

  return `Recommend the essential Indian pantry staples someone should keep stocked to prepare protein-rich Indian meals for lunch and dinner.${nutritionText}

Also suggest 2 example lunch and 2 example dinner meals that can be made from these pantry essentials.

Respond with this exact JSON structure:
{
  "pantryItems": [
    { "category": "Proteins", "items": ["Moong dal", "Chana dal", "Paneer", "Chicken", "Eggs"] },
    { "category": "Grains & Carbs", "items": ["Basmati rice", "Whole wheat atta"] },
    { "category": "Vegetables", "items": ["Spinach", "Tomatoes", "Onions", "Garlic", "Ginger"] },
    { "category": "Spices & Condiments", "items": ["Cumin", "Coriander", "Turmeric", "Garam masala"] },
    { "category": "Fats & Dairy", "items": ["Ghee", "Mustard oil", "Curd/Yogurt"] }
  ],
  "lunch": [
    {
      "name": "Meal Name",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "cookTime": "25 mins",
      "servingSize": "1 serving",
      "nutrition": { "calories": 450, "protein": 28, "carbs": 35, "fat": 12 },
      "instructions": ["Step 1", "Step 2", "Step 3"]
    }
  ],
  "dinner": [
    {
      "name": "Meal Name",
      "description": "Brief description",
      "ingredients": ["ingredient 1", "ingredient 2"],
      "cookTime": "30 mins",
      "servingSize": "1 serving",
      "nutrition": { "calories": 500, "protein": 32, "carbs": 40, "fat": 14 },
      "instructions": ["Step 1", "Step 2", "Step 3"]
    }
  ]
}`;
};

app.post('/api/suggest-meals', async (req, res) => {
  const { mode, ingredients, targetNutrition } = req.body;

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'ANTHROPIC_API_KEY not configured' });
  }

  try {
    const prompt = mode === 'ingredients'
      ? buildIngredientPrompt(ingredients, targetNutrition)
      : buildPantryPrompt(targetNutrition);

    const message = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    });

    const text = message.content[0].text.trim();
    const data = JSON.parse(text);
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message || 'Failed to generate meal suggestions' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
