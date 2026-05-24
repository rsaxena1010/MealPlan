import { useState, useEffect } from 'react';
import MealCard from './components/MealCard';
import NutritionTargetForm from './components/NutritionTargetForm';
import PantrySection from './components/PantrySection';
import DailySummary from './components/DailySummary';
import type { MealSuggestions, TargetNutrition } from './types';
import { loadMealDatabase, filterByIngredients, splitLunchDinner } from './services/mealdb';
import { PANTRY_ESSENTIALS } from './data/pantryEssentials';
import './App.css';

type Mode = 'ingredients' | 'pantry';

export default function App() {
  const [mode, setMode] = useState<Mode>('ingredients');
  const [ingredients, setIngredients] = useState('');
  const [target, setTarget] = useState<TargetNutrition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<MealSuggestions | null>(null);

  // Preload the meal database in the background on mount
  useEffect(() => {
    loadMealDatabase().catch(() => {
      // Silently fall back to local data; errors surface on suggest click
    });
  }, []);

  // Re-preload when mode changes
  useEffect(() => {
    loadMealDatabase().catch(() => {});
  }, [mode]);

  const suggest = async () => {
    if (mode === 'ingredients' && !ingredients.trim()) {
      setError('Please enter at least one ingredient.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);

    try {
      const allMeals = await loadMealDatabase();

      let candidates = allMeals;

      if (mode === 'ingredients') {
        candidates = filterByIngredients(allMeals, ingredients.trim());
        if (candidates.length === 0) {
          // No ingredient matches — suggest from full pool
          candidates = allMeals;
        }
      } else {
        // Pantry mode: shuffle slightly for variety
        candidates = [...allMeals].sort(() => Math.random() - 0.5);
      }

      const { lunch, dinner } = splitLunchDinner(candidates);

      const mealSuggestions: MealSuggestions = {
        lunch,
        dinner,
        pantryItems: mode === 'pantry' ? PANTRY_ESSENTIALS : undefined,
      };

      setResults(mealSuggestions);
    } catch (e: unknown) {
      setError((e as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🍛</span>
            <div>
              <h1>Indian Meal Planner</h1>
              <p>Protein-rich Indian meals, planned for you</p>
            </div>
          </div>
        </div>
      </header>

      <main className="main">
        {/* Mode Toggle */}
        <div className="mode-toggle-container">
          <div className="mode-toggle">
            <button
              className={`toggle-btn ${mode === 'ingredients' ? 'active' : ''}`}
              onClick={() => { setMode('ingredients'); setResults(null); }}
            >
              <span className="toggle-icon">🥬</span>
              My Ingredients
            </button>
            <button
              className={`toggle-btn ${mode === 'pantry' ? 'active' : ''}`}
              onClick={() => { setMode('pantry'); setResults(null); }}
            >
              <span className="toggle-icon">🛒</span>
              Pantry Essentials
            </button>
          </div>
          <p className="mode-desc">
            {mode === 'ingredients'
              ? 'Enter what you have and get meal suggestions tailored to your fridge'
              : 'Discover which ingredients to stock for protein-rich Indian cooking'}
          </p>
        </div>

        {/* Input Panel */}
        <div className="input-panel">
          {mode === 'ingredients' && (
            <div className="ingredient-input-section">
              <label className="input-label">
                What ingredients do you have?
              </label>
              <textarea
                className="ingredient-textarea"
                placeholder="e.g. chicken breast, paneer, moong dal, spinach, tomatoes, rice..."
                value={ingredients}
                onChange={e => setIngredients(e.target.value)}
                rows={3}
              />
              <p className="input-hint">Separate with commas or new lines</p>
            </div>
          )}

          <NutritionTargetForm target={target} onChange={setTarget} />

          {error && <div className="error-msg">{error}</div>}

          <button
            className="suggest-btn"
            onClick={suggest}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="spinner" />
                Loading recipes...
              </>
            ) : (
              <>
                <span>✨</span>
                {mode === 'ingredients' ? 'Suggest Meals' : 'Show Pantry Essentials & Meal Ideas'}
              </>
            )}
          </button>
        </div>

        {/* Results */}
        {results && (
          <div className="results">
            {results.pantryItems && (
              <PantrySection pantryItems={results.pantryItems} />
            )}

            <div className="meals-grid">
              {/* Lunch */}
              <div className="meal-column">
                <div className="meal-column-header lunch">
                  <span>☀️</span>
                  <h2>Lunch Options</h2>
                </div>
                {results.lunch.map((meal, i) => (
                  <MealCard key={meal.id ?? i} meal={meal} mealType="lunch" />
                ))}
              </div>

              {/* Dinner */}
              <div className="meal-column">
                <div className="meal-column-header dinner">
                  <span>🌙</span>
                  <h2>Dinner Options</h2>
                </div>
                {results.dinner.map((meal, i) => (
                  <MealCard key={meal.id ?? i} meal={meal} mealType="dinner" />
                ))}
              </div>
            </div>

            <DailySummary lunch={results.lunch} dinner={results.dinner} target={target} />
          </div>
        )}
      </main>

      <footer className="app-footer">
        <p>Nutritional values are estimates. Consult a dietitian for personalized advice.</p>
      </footer>
    </div>
  );
}
