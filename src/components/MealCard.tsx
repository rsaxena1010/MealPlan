import { useState } from 'react';
import type { Meal } from '../types';
import NutritionBar from './NutritionBar';
import FeedbackButtons from './FeedbackButtons';
import { useAuth } from '../contexts/AuthContext';
import { saveDayMeal } from '../services/storage';

interface Props {
  meal: Meal;
  mealType: 'lunch' | 'dinner';
}

const MEAL_ICONS = { lunch: '☀️', dinner: '🌙' };

function todayStr(): string {
  return new Date().toISOString().split('T')[0];
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

export default function MealCard({ meal, mealType }: Props) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);

  const saveToday = () => {
    if (!user) return;
    const today = todayStr();
    const weekStart = getMonday(new Date()).toISOString().split('T')[0];
    saveDayMeal(user.id, weekStart, today, mealType, meal);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="meal-card">
      {meal.thumbnail && (
        <img src={meal.thumbnail} alt={meal.name} className="meal-thumb" />
      )}
      <div className="meal-card-header" onClick={() => setExpanded(!expanded)}>
        <div className="meal-card-title-row">
          <span className="meal-type-icon">{MEAL_ICONS[mealType]}</span>
          <div>
            <h3 className="meal-name">{meal.name}</h3>
            <p className="meal-desc">{meal.description}</p>
          </div>
        </div>
        <div className="meal-meta">
          <span className="meal-meta-tag">⏱ {meal.cookTime}</span>
          <span className="meal-meta-tag">👤 {meal.servingSize}</span>
          <button className="expand-btn">{expanded ? '▲' : '▼'}</button>
        </div>
      </div>

      <NutritionBar nutrition={meal.nutrition} compact />

      <div className="meal-card-footer">
        {user ? (
          <>
            <button
              className={`save-btn ${saved ? 'saved' : ''}`}
              onClick={saveToday}
              title={`Save as today's ${mealType}`}
            >
              {saved ? '✓ Saved to today' : `💾 Save as ${mealType}`}
            </button>
            <FeedbackButtons mealId={meal.id} userId={user.id} />
          </>
        ) : (
          <span className="sign-in-hint">Sign in to save plans & give feedback</span>
        )}
      </div>

      {expanded && (
        <div className="meal-details">
          <div className="meal-section">
            <h4>Ingredients</h4>
            <ul className="ingredient-list">
              {meal.ingredients.map((ing, i) => (
                <li key={i}>{ing}</li>
              ))}
            </ul>
          </div>
          <div className="meal-section">
            <h4>Instructions</h4>
            <ol className="instruction-list">
              {meal.instructions.map((step, i) => (
                <li key={i}>{step}</li>
              ))}
            </ol>
          </div>
        </div>
      )}
    </div>
  );
}
