import { useState } from 'react';
import type { Meal } from '../types';
import NutritionBar from './NutritionBar';

interface Props {
  meal: Meal;
  mealType: 'lunch' | 'dinner';
}

const MEAL_ICONS = { lunch: '☀️', dinner: '🌙' };

export default function MealCard({ meal, mealType }: Props) {
  const [expanded, setExpanded] = useState(false);

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
