import type { NutritionTotals } from '../domain/types';

/**
 * Daily reference intakes for adults aged 18 to 64 at ordinary activity level,
 * following the Japanese dietary reference intakes. Reference points, not prescriptions.
 * Salt is an upper limit; fat and carbohydrate are midpoints of their energy ranges.
 */
export const DAILY_TARGETS: Record<'adult_male' | 'adult_female', NutritionTotals> = {
  adult_male: {
    energy: 2650,
    protein: 65,
    fat: 73,
    carbs: 364,
    fiber: 21,
    salt: 7.5,
    calcium: 750,
    iron: 7.5,
    potassium: 3000,
    vitaminA: 850,
    vitaminB1: 1.4,
    vitaminB2: 1.6,
    vitaminC: 100,
    vitaminD: 8.5,
  },
  adult_female: {
    energy: 2000,
    protein: 50,
    fat: 55,
    carbs: 275,
    fiber: 18,
    salt: 6.5,
    calcium: 650,
    iron: 10.5,
    potassium: 2600,
    vitaminA: 650,
    vitaminB1: 1.1,
    vitaminB2: 1.2,
    vitaminC: 100,
    vitaminD: 8.5,
  },
};
