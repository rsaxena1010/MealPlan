import { useState, useEffect, useRef } from 'react';
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
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getMonday(d: Date): Date {
  const date = new Date(d);
  const day = date.getDay();
  date.setDate(date.getDate() - day + (day === 0 ? -6 : 1));
  date.setHours(0, 0, 0, 0);
  return date;
}

// Next 7 days starting today
function upcomingDays(): { label: string; dateStr: string }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    const label = i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : DAY_NAMES[d.getDay()];
    return { label, dateStr: toDateStr(d) };
  });
}

export default function MealCard({ meal, mealType }: Props) {
  const { user } = useAuth();
  const [expanded, setExpanded] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [slot, setSlot] = useState<'lunch' | 'dinner'>(mealType);
  const [savedDate, setSavedDate] = useState<string | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  // Close picker on outside click
  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [pickerOpen]);

  const save = (dateStr: string) => {
    if (!user) return;
    const weekStart = toDateStr(getMonday(new Date(dateStr + 'T12:00:00')));
    saveDayMeal(user.id, weekStart, dateStr, slot, meal);
    setSavedDate(dateStr);
    setPickerOpen(false);
    setTimeout(() => setSavedDate(null), 2500);
  };

  const days = upcomingDays();

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
            <div className="save-wrapper" ref={pickerRef}>
              <button
                className={`save-btn ${savedDate ? 'saved' : ''}`}
                onClick={() => { if (!savedDate) setPickerOpen(p => !p); }}
              >
                {savedDate
                  ? `✓ Saved to ${days.find(d => d.dateStr === savedDate)?.label ?? savedDate}`
                  : '💾 Save to Plan'}
              </button>

              {pickerOpen && (
                <div className="date-picker-popover">
                  {/* Slot selector */}
                  <div className="slot-selector">
                    <button
                      className={slot === 'lunch' ? 'active' : ''}
                      onClick={() => setSlot('lunch')}
                    >☀️ Lunch</button>
                    <button
                      className={slot === 'dinner' ? 'active' : ''}
                      onClick={() => setSlot('dinner')}
                    >🌙 Dinner</button>
                  </div>

                  {/* Day chips */}
                  <div className="day-chips">
                    {days.map(({ label, dateStr }) => (
                      <button
                        key={dateStr}
                        className="day-chip"
                        onClick={() => save(dateStr)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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
