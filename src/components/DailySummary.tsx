import type { Meal, Nutrition, TargetNutrition } from '../types';
import NutritionBar from './NutritionBar';

interface Props {
  lunch: Meal[];
  dinner: Meal[];
  target: TargetNutrition | null;
}

function sumNutrition(meals: Meal[]): Nutrition {
  return meals.reduce(
    (acc, m) => ({
      calories: acc.calories + m.nutrition.calories,
      protein: acc.protein + m.nutrition.protein,
      carbs: acc.carbs + m.nutrition.carbs,
      fat: acc.fat + m.nutrition.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export default function DailySummary({ lunch, dinner, target }: Props) {
  const lunchTotal = sumNutrition(lunch);
  const dinnerTotal = sumNutrition(dinner);
  const dayTotal: Nutrition = {
    calories: lunchTotal.calories + dinnerTotal.calories,
    protein: lunchTotal.protein + dinnerTotal.protein,
    carbs: lunchTotal.carbs + dinnerTotal.carbs,
    fat: lunchTotal.fat + dinnerTotal.fat,
  };

  return (
    <div className="daily-summary">
      <h2 className="summary-title">Daily Summary <span className="summary-note">(per person)</span></h2>
      <div className="summary-rows">
        <NutritionBar nutrition={lunchTotal} label="Lunch total" />
        <NutritionBar nutrition={dinnerTotal} label="Dinner total" />
        <div className="summary-divider" />
        <NutritionBar nutrition={dayTotal} target={target ?? undefined} label="Day total" />
      </div>
      {target && (
        <div className="target-progress">
          {(['calories', 'protein', 'carbs', 'fat'] as const).map(field => {
            const pct = Math.min(100, Math.round((dayTotal[field] / target[field]) * 100));
            const over = dayTotal[field] > target[field];
            return (
              <div key={field} className="progress-item">
                <div className="progress-label-row">
                  <span>{field}</span>
                  <span className={over ? 'over-target' : ''}>{pct}%</span>
                </div>
                <div className="progress-track">
                  <div
                    className={`progress-fill ${over ? 'over' : ''}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
