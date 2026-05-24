import { useState } from 'react';
import MealCard from './components/MealCard';
import NutritionTargetForm from './components/NutritionTargetForm';
import PantrySection from './components/PantrySection';
import DailySummary from './components/DailySummary';
import type { MealSuggestions, TargetNutrition } from './types';
import './App.css';

type Mode = 'ingredients' | 'pantry';

export default function App() {
  const [mode, setMode] = useState<Mode>('ingredients');
  const [ingredients, setIngredients] = useState('');
  const [target, setTarget] = useState<TargetNutrition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<MealSuggestions | null>(null);

  const suggest = async () => {
    if (mode === 'ingredients' && !ingredients.trim()) {
      setError('Please enter at least one ingredient.');
      return;
    }
    setError('');
    setLoading(true);
    setResults(null);
    try {
      const res = await fetch('/api/suggest-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode, ingredients: ingredients.trim(), targetNutrition: target }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Server error');
      }
      const data: MealSuggestions = await res.json();
      setResults(data);
    } catch (e: unknown) {
      setError((e as Error).message || 'Something went wrong');
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
                Crafting your meal plan...
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
                  <MealCard key={i} meal={meal} mealType="lunch" />
                ))}
              </div>

              {/* Dinner */}
              <div className="meal-column">
                <div className="meal-column-header dinner">
                  <span>🌙</span>
                  <h2>Dinner Options</h2>
                </div>
                {results.dinner.map((meal, i) => (
                  <MealCard key={i} meal={meal} mealType="dinner" />
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
