import { useState } from 'react';
import type { TargetNutrition } from '../types';

interface Props {
  target: TargetNutrition | null;
  onChange: (t: TargetNutrition | null) => void;
}

const DEFAULTS: TargetNutrition = { calories: 2000, protein: 120, carbs: 200, fat: 65 };

export default function NutritionTargetForm({ target, onChange }: Props) {
  const [enabled, setEnabled] = useState(!!target);
  const [values, setValues] = useState<TargetNutrition>(target ?? DEFAULTS);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    onChange(next ? values : null);
  };

  const update = (field: keyof TargetNutrition, val: string) => {
    const n = { ...values, [field]: Number(val) };
    setValues(n);
    if (enabled) onChange(n);
  };

  return (
    <div className="target-form">
      <div className="target-toggle-row">
        <label className="toggle-label">
          <input type="checkbox" checked={enabled} onChange={toggle} />
          <span className="toggle-text">Set daily nutrition targets</span>
        </label>
      </div>
      {enabled && (
        <div className="target-inputs">
          {(['calories', 'protein', 'carbs', 'fat'] as const).map(field => (
            <div key={field} className="target-input-group">
              <label>{field.charAt(0).toUpperCase() + field.slice(1)}</label>
              <input
                type="number"
                value={values[field]}
                min={0}
                onChange={e => update(field, e.target.value)}
              />
              <span className="target-unit">{field === 'calories' ? 'kcal' : 'g'}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
