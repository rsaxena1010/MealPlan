import type { PantryItem } from '../types';

const CATEGORY_ICONS: Record<string, string> = {
  'Proteins': '🥩',
  'Grains & Carbs': '🌾',
  'Vegetables': '🥦',
  'Spices & Condiments': '🌶️',
  'Fats & Dairy': '🧈',
};

interface Props {
  pantryItems: PantryItem[];
}

export default function PantrySection({ pantryItems }: Props) {
  return (
    <div className="pantry-section">
      <h2 className="section-title">Essential Indian Pantry</h2>
      <p className="section-subtitle">Stock these ingredients to prepare protein-rich Indian meals anytime</p>
      <div className="pantry-grid">
        {pantryItems.map((cat) => (
          <div key={cat.category} className="pantry-card">
            <h3 className="pantry-category">
              {CATEGORY_ICONS[cat.category] ?? '🫙'} {cat.category}
            </h3>
            <ul className="pantry-items">
              {cat.items.map((item, i) => (
                <li key={i} className="pantry-item">
                  <span className="pantry-dot" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
