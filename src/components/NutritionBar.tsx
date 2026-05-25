import type { Nutrition } from '../types';

interface Props {
  nutrition: Nutrition;
  target?: Nutrition;
  label?: string;
  compact?: boolean;
}

export default function NutritionBar({ nutrition, target, label, compact }: Props) {
  const badges = [
    { key: 'calories', label: 'Cal', value: nutrition.calories, unit: 'kcal', color: '#f97316', targetVal: target?.calories },
    { key: 'protein', label: 'Protein', value: nutrition.protein, unit: 'g', color: '#22c55e', targetVal: target?.protein },
    { key: 'carbs', label: 'Carbs', value: nutrition.carbs, unit: 'g', color: '#3b82f6', targetVal: target?.carbs },
    { key: 'fat', label: 'Fat', value: nutrition.fat, unit: 'g', color: '#a855f7', targetVal: target?.fat },
  ];

  return (
    <div className={`nutrition-bar ${compact ? 'compact' : ''}`}>
      {label && <span className="nutrition-label">{label}</span>}
      <div className="nutrition-badges">
        {badges.map(b => (
          <div key={b.key} className="nutrition-badge" style={{ borderColor: b.color }}>
            <span className="badge-value" style={{ color: b.color }}>
              {b.value}
              <span className="badge-unit">{b.unit}</span>
            </span>
            <span className="badge-label">{b.label}</span>
            {b.targetVal && (
              <span className="badge-target">/ {b.targetVal}{b.unit}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
