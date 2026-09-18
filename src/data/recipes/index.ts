import type { Recipe } from '../../domain/types';
import { CHINESE_RECIPES } from './chinese';
import { JAPANESE_RECIPES } from './japanese';
import { OTHER_RECIPES } from './other';
import { WESTERN_RECIPES } from './western';

export const PRESET_RECIPES: Recipe[] = [
  ...JAPANESE_RECIPES,
  ...WESTERN_RECIPES,
  ...CHINESE_RECIPES,
  ...OTHER_RECIPES,
];
