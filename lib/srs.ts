/**
 * SM-2 spaced repetition (Anki-style).
 * Grades: 0=again, 1=hard, 2=good, 3=easy.
 */

export type ReviewState = {
  ease: number;
  interval_days: number;
  repetitions: number;
  due_at: Date;
};

export function initialReview(): ReviewState {
  return {
    ease: 2.5,
    interval_days: 0,
    repetitions: 0,
    due_at: new Date(),
  };
}

export function grade(state: ReviewState, quality: 0 | 1 | 2 | 3): ReviewState {
  const q = quality === 0 ? 0 : quality === 1 ? 3 : quality === 2 ? 4 : 5;
  let { ease, interval_days, repetitions } = state;

  if (q < 3) {
    // Failed — reset
    repetitions = 0;
    interval_days = 1;
  } else {
    if (repetitions === 0) interval_days = 1;
    else if (repetitions === 1) interval_days = 6;
    else interval_days = Math.round(interval_days * ease);
    repetitions += 1;
  }

  ease = Math.max(1.3, ease + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)));

  const due_at = new Date();
  due_at.setDate(due_at.getDate() + interval_days);

  return { ease, interval_days, repetitions, due_at };
}
