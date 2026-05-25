import { useState, useEffect } from 'react';
import MealCard from './components/MealCard';
import NutritionTargetForm from './components/NutritionTargetForm';
import PantrySection from './components/PantrySection';
import DailySummary from './components/DailySummary';
import AuthModal from './components/AuthModal';
import WeeklyPlanner from './components/WeeklyPlanner';
import type { MealSuggestions, TargetNutrition, User } from './types';
import { loadMealDatabase, filterByIngredients, splitLunchDinner } from './services/mealdb';
import { getAllFeedback } from './services/storage';
import { logout } from './services/auth';
import { PANTRY_ESSENTIALS } from './data/pantryEssentials';
import { useAuth } from './contexts/AuthContext';
import './App.css';

type Mode = 'ingredients' | 'pantry';
type View = 'planner' | 'week';

export default function App() {
  const { user, setUser } = useAuth();
  const [view, setView] = useState<View>('planner');
  const [mode, setMode] = useState<Mode>('ingredients');
  const [ingredients, setIngredients] = useState('');
  const [target, setTarget] = useState<TargetNutrition | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [results, setResults] = useState<MealSuggestions | null>(null);
  const [showAuth, setShowAuth] = useState(false);

  useEffect(() => {
    loadMealDatabase().catch(() => {});
  }, []);

  const handleAuthSuccess = (u: User) => {
    setUser(u);
    setShowAuth(false);
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setView('planner');
  };

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
      const feedbackMap = user
        ? Object.fromEntries(
            Object.entries(getAllFeedback(user.id)).map(([id, fb]) => [id, fb.relevance])
          )
        : undefined;

      let candidates = allMeals;
      if (mode === 'ingredients') {
        const filtered = filterByIngredients(allMeals, ingredients.trim(), feedbackMap);
        candidates = filtered.length > 0 ? filtered : allMeals;
      } else {
        candidates = [...allMeals].sort(() => Math.random() - 0.5);
      }

      const { lunch, dinner } = splitLunchDinner(candidates);
      setResults({
        lunch,
        dinner,
        pantryItems: mode === 'pantry' ? PANTRY_ESSENTIALS : undefined,
      });
    } catch (e: unknown) {
      setError((e as Error).message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app">
      <header className="app-header no-print">
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🍛</span>
            <div>
              <h1>Indian Meal Planner</h1>
              <p>Protein-rich Indian meals, planned for you</p>
            </div>
          </div>
          <div className="header-actions">
            {user ? (
              <div className="user-menu">
                <span className="user-greeting">👤 {user.id}</span>
                <button className="header-btn secondary" onClick={handleLogout}>Log out</button>
              </div>
            ) : (
              <button className="header-btn" onClick={() => setShowAuth(true)}>Sign In / Register</button>
            )}
          </div>
        </div>

        {/* Nav tabs */}
        <div className="nav-tabs">
          <button
            className={`nav-tab ${view === 'planner' ? 'active' : ''}`}
            onClick={() => setView('planner')}
          >🍽 Meal Suggestions</button>
          <button
            className={`nav-tab ${view === 'week' ? 'active' : ''}`}
            onClick={() => { if (!user) { setShowAuth(true); } else { setView('week'); } }}
          >📅 My Week {!user && <span className="lock-icon">🔒</span>}</button>
        </div>
      </header>

      <main className="main">
        {view === 'week' && user ? (
          <WeeklyPlanner userId={user.id} />
        ) : (
          <>
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
                  <label className="input-label">What ingredients do you have?</label>
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

              <button className="suggest-btn" onClick={suggest} disabled={loading}>
                {loading ? (
                  <><span className="spinner" />Loading recipes…</>
                ) : (
                  <><span>✨</span>{mode === 'ingredients' ? 'Suggest Meals' : 'Show Pantry Essentials & Meal Ideas'}</>
                )}
              </button>
            </div>

            {/* Results */}
            {results && (
              <div className="results">
                {results.pantryItems && <PantrySection pantryItems={results.pantryItems} />}

                <div className="meals-grid">
                  <div className="meal-column">
                    <div className="meal-column-header lunch">
                      <span>☀️</span><h2>Lunch Options</h2>
                    </div>
                    {results.lunch.map((meal, i) => (
                      <MealCard key={meal.id ?? i} meal={meal} mealType="lunch" />
                    ))}
                  </div>
                  <div className="meal-column">
                    <div className="meal-column-header dinner">
                      <span>🌙</span><h2>Dinner Options</h2>
                    </div>
                    {results.dinner.map((meal, i) => (
                      <MealCard key={meal.id ?? i} meal={meal} mealType="dinner" />
                    ))}
                  </div>
                </div>

                <DailySummary lunch={results.lunch} dinner={results.dinner} target={target} />
              </div>
            )}
          </>
        )}
      </main>

      <footer className="app-footer no-print">
        <p>Nutritional values are estimates. Consult a dietitian for personalised advice.</p>
      </footer>

      {showAuth && (
        <AuthModal onSuccess={handleAuthSuccess} onClose={() => setShowAuth(false)} />
      )}
    </div>
  );
}
