import { useState } from 'react';
import type { MealFeedback } from '../types';
import { getMealFeedback, setMealFeedback } from '../services/storage';

interface Props {
  mealId: string;
  userId: string;
}

export default function FeedbackButtons({ mealId, userId }: Props) {
  const [current, setCurrent] = useState<'up' | 'down' | null>(
    () => getMealFeedback(userId, mealId)?.relevance ?? null,
  );

  const give = (relevance: 'up' | 'down') => {
    const fb: MealFeedback = { mealId, relevance, timestamp: new Date().toISOString() };
    setMealFeedback(userId, fb);
    setCurrent(relevance);
  };

  return (
    <div className="feedback-row">
      <span className="feedback-label">Relevant?</span>
      <button
        className={`feedback-btn ${current === 'up' ? 'active-up' : ''}`}
        onClick={() => give('up')}
        title="Yes, relevant to my ingredients"
      >👍</button>
      <button
        className={`feedback-btn ${current === 'down' ? 'active-down' : ''}`}
        onClick={() => give('down')}
        title="Not relevant to my ingredients"
      >👎</button>
    </div>
  );
}
