import { useState, useEffect } from 'react';
import type { Meal, DayPlan } from '../types';
import { getWeekPlan, saveDayMeal, deleteDayMeal } from '../services/storage';
import { loadMealDatabase } from '../services/mealdb';

interface Props {
  userId: string;
}

function getMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

function displayDate(dateStr: string): string {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('en-IN', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}

function collectShoppingList(plan: Record<string, DayPlan>): string[] {
  const seen = new Set<string>();
  const list: string[] = [];
  for (const day of Object.values(plan)) {
    for (const meal of [day.lunch, day.dinner]) {
      if (!meal) continue;
      for (const ing of meal.ingredients) {
        const key = ing.replace(/^[\d/. ]+(cup|tbsp|tsp|g|kg|ml|l|large|medium|small|piece|pieces|slice|slices|clove|cloves)?\s*/i, '').toLowerCase().trim();
        if (!seen.has(key)) { seen.add(key); list.push(ing); }
      }
    }
  }
  return list;
}

export default function WeeklyPlanner({ userId }: Props) {
  const [weekStart, setWeekStart] = useState(() => toDateStr(getMonday(new Date())));
  const [plan, setPlan] = useState<Record<string, DayPlan>>({});
  const [allMeals, setAllMeals] = useState<Meal[]>([]);
  const [picker, setPicker] = useState<{ date: string; slot: 'lunch' | 'dinner' } | null>(null);
  const [pickerSearch, setPickerSearch] = useState('');

  useEffect(() => {
    setPlan(getWeekPlan(userId, weekStart));
  }, [userId, weekStart]);

  useEffect(() => {
    loadMealDatabase().then(setAllMeals).catch(() => {});
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + i);
    return toDateStr(d);
  });

  const shiftWeek = (delta: number) => {
    const d = new Date(weekStart + 'T12:00:00');
    d.setDate(d.getDate() + delta * 7);
    setWeekStart(toDateStr(getMonday(d)));
  };

  const assignMeal = (meal: Meal) => {
    if (!picker) return;
    const { date, slot } = picker;
    saveDayMeal(userId, weekStart, date, slot, meal);
    setPlan(prev => ({
      ...prev,
      [date]: { ...prev[date] ?? { date }, [slot]: meal },
    }));
    setPicker(null);
    setPickerSearch('');
  };

  const removeMeal = (date: string, slot: 'lunch' | 'dinner') => {
    deleteDayMeal(userId, weekStart, date, slot);
    setPlan(prev => {
      const day = { ...prev[date] };
      delete day[slot];
      return { ...prev, [date]: day };
    });
  };

  const weekLabel = new Date(weekStart + 'T12:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  const isCurrentWeek = weekStart === toDateStr(getMonday(new Date()));

  const filteredMeals = allMeals.filter(m =>
    !pickerSearch || m.name.toLowerCase().includes(pickerSearch.toLowerCase())
  );

  const shoppingList = collectShoppingList(plan);
  const hasPlan = Object.values(plan).some(d => d.lunch || d.dinner);

  return (
    <div className="weekly-planner">
      <div className="planner-toolbar no-print">
        <div className="week-nav">
          <button className="week-nav-btn" onClick={() => shiftWeek(-1)}>‹</button>
          <span className="week-label">
            Week of {weekLabel}
            {isCurrentWeek && <span className="current-badge">This week</span>}
          </span>
          <button className="week-nav-btn" onClick={() => shiftWeek(1)}>›</button>
        </div>
        <button className="print-btn" onClick={() => window.print()}>🖨 Print Plan</button>
      </div>

      {/* Print-only title */}
      <div className="print-only print-title">
        Indian Meal Planner — Week of {weekLabel}
      </div>

      <div className="planner-grid">
        <div className="planner-header-row">
          <div className="planner-col-header day-col" />
          <div className="planner-col-header">☀️ Lunch</div>
          <div className="planner-col-header">🌙 Dinner</div>
        </div>

        {weekDays.map(date => {
          const day = plan[date] ?? { date };
          return (
            <div key={date} className="planner-row">
              <div className="planner-day-label">{displayDate(date)}</div>

              {(['lunch', 'dinner'] as const).map(slot => (
                <div key={slot} className={`planner-slot ${day[slot] ? 'filled' : 'empty'}`}>
                  {day[slot] ? (
                    <div className="planner-meal-item">
                      <span className="planner-meal-name">{day[slot]!.name}</span>
                      <span className="planner-meal-nutrition">
                        {day[slot]!.nutrition.calories} kcal · {day[slot]!.nutrition.protein}g protein
                      </span>
                      <div className="planner-meal-actions no-print">
                        <button onClick={() => { setPicker({ date, slot }); setPickerSearch(''); }}>Edit</button>
                        <button className="remove-btn" onClick={() => removeMeal(date, slot)}>✕</button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="planner-add-btn no-print"
                      onClick={() => { setPicker({ date, slot }); setPickerSearch(''); }}
                    >+ Add</button>
                  )}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Shopping list for print */}
      {hasPlan && (
        <div className="shopping-list print-only">
          <h3>Shopping List</h3>
          <ul>
            {shoppingList.map((item, i) => <li key={i}>{item}</li>)}
          </ul>
        </div>
      )}

      {/* Meal picker modal */}
      {picker && (
        <div className="modal-overlay" onClick={() => setPicker(null)}>
          <div className="modal-card meal-picker-card" onClick={e => e.stopPropagation()}>
            <div className="meal-picker-header">
              <h3>Choose a {picker.slot === 'lunch' ? '☀️ Lunch' : '🌙 Dinner'}</h3>
              <button className="modal-close" onClick={() => setPicker(null)}>✕</button>
            </div>
            <input
              className="meal-picker-search"
              type="text"
              placeholder="Search meals…"
              value={pickerSearch}
              onChange={e => setPickerSearch(e.target.value)}
              autoFocus
            />
            <div className="meal-picker-list">
              {filteredMeals.map(meal => (
                <div key={meal.id} className="meal-picker-item" onClick={() => assignMeal(meal)}>
                  {meal.thumbnail && <img src={meal.thumbnail} alt="" className="meal-picker-thumb" />}
                  <div className="meal-picker-info">
                    <span className="meal-picker-name">{meal.name}</span>
                    <span className="meal-picker-meta">
                      {meal.nutrition.calories} kcal · {meal.nutrition.protein}g protein · {meal.cookTime}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
