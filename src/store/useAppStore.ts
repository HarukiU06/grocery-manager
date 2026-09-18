import { create } from 'zustand';
import { createJSONStorage, persist, type StateStorage } from 'zustand/middleware';
import { COMMON_STAPLE_IDS } from '../data/staples';
import { todayIso } from '../domain/dates';
import { newId } from '../domain/ids';
import {
  CURRENT_SCHEMA_VERSION,
  type Ingredient,
  type Lang,
  type LocalizedText,
  type PantryItem,
  type PersistedState,
  type Recipe,
} from '../domain/types';
import { clamp, defaultPersistedState, detectLanguage, migrate } from './migrations';

export const STORAGE_KEY = 'grocery-manager';

let storageAvailable = true;
const memory = new Map<string, string>();
const memoryStorage: StateStorage = {
  getItem: (name) => memory.get(name) ?? null,
  setItem: (name, value) => {
    memory.set(name, value);
  },
  removeItem: (name) => {
    memory.delete(name);
  },
};

function resolveStorage(): StateStorage {
  try {
    const probe = '__grocery_manager_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    return window.localStorage;
  } catch {
    storageAvailable = false;
    return memoryStorage;
  }
}

export function isStorageAvailable(): boolean {
  return storageAvailable;
}

export type PantryItemFields = Omit<PantryItem, 'ingredientId' | 'addedOn'>;
export type IngredientInput = Omit<Ingredient, 'id' | 'isPreset'>;
export type RecipeInput = Omit<Recipe, 'id' | 'isPreset'>;

export interface AppActions {
  setLanguage: (language: Lang) => void;
  setServings: (servings: number) => void;
  setAlmostThreshold: (threshold: number) => void;
  addPantryItem: (ingredientId: string, fields?: PantryItemFields) => void;
  updatePantryItem: (ingredientId: string, patch: PantryItemFields) => void;
  removePantryItem: (ingredientId: string) => void;
  addCommonStaples: () => number;
  createIngredient: (input: IngredientInput) => Ingredient;
  addCustomRecipe: (input: RecipeInput) => Recipe;
  updateCustomRecipe: (id: string, input: RecipeInput) => void;
  deleteCustomRecipe: (id: string) => void;
  duplicateRecipe: (source: Recipe) => Recipe;
  addToShopping: (ingredientId: string) => void;
  removeFromShopping: (ingredientId: string) => void;
  markBought: (ingredientId: string) => void;
  importState: (state: PersistedState) => void;
  resetAll: () => void;
}

export type AppStore = PersistedState & AppActions;

const PERSISTED_KEYS: readonly (keyof PersistedState)[] = [
  'schemaVersion',
  'language',
  'servings',
  'almostThreshold',
  'customIngredients',
  'pantry',
  'customRecipes',
  'shoppingList',
];

export function pickPersisted(store: AppStore): PersistedState {
  const out: Record<string, unknown> = {};
  for (const key of PERSISTED_KEYS) out[key] = store[key];
  return out as unknown as PersistedState;
}

const COPY_SUFFIX: Record<Lang, string> = { ja: '（コピー）', en: ' (copy)' };

function withCopySuffix(name: LocalizedText): LocalizedText {
  return {
    ...(name.ja ? { ja: name.ja + COPY_SUFFIX.ja } : {}),
    ...(name.en ? { en: name.en + COPY_SUFFIX.en } : {}),
  };
}

const initialLanguage = detectLanguage(typeof navigator !== 'undefined' ? navigator.language : undefined);

export const useAppStore = create<AppStore>()(
  persist<AppStore, [], [], PersistedState>(
    (set, get) => ({
      ...defaultPersistedState(initialLanguage),

      setLanguage: (language) => set({ language }),
      setServings: (servings) => set({ servings: clamp(Math.round(servings), 1, 12) }),
      setAlmostThreshold: (threshold) => set({ almostThreshold: clamp(Math.round(threshold), 1, 5) }),

      addPantryItem: (ingredientId, fields = {}) =>
        set((state) => {
          const exists = state.pantry.some((item) => item.ingredientId === ingredientId);
          if (exists) {
            return {
              pantry: state.pantry.map((item) => (item.ingredientId === ingredientId ? { ...item, ...fields } : item)),
            };
          }
          return { pantry: [...state.pantry, { ingredientId, addedOn: todayIso(), ...fields }] };
        }),
      updatePantryItem: (ingredientId, patch) =>
        set((state) => ({
          pantry: state.pantry.map((item) => (item.ingredientId === ingredientId ? { ...item, ...patch } : item)),
        })),
      removePantryItem: (ingredientId) =>
        set((state) => ({ pantry: state.pantry.filter((item) => item.ingredientId !== ingredientId) })),
      addCommonStaples: () => {
        const have = new Set(get().pantry.map((item) => item.ingredientId));
        const missing = COMMON_STAPLE_IDS.filter((id) => !have.has(id));
        if (missing.length > 0) {
          const addedOn = todayIso();
          set((state) => ({
            pantry: [...state.pantry, ...missing.map((ingredientId) => ({ ingredientId, addedOn }))],
          }));
        }
        return missing.length;
      },

      createIngredient: (input) => {
        const ingredient: Ingredient = { ...input, id: newId('custom'), isPreset: false };
        set((state) => ({ customIngredients: [...state.customIngredients, ingredient] }));
        return ingredient;
      },

      addCustomRecipe: (input) => {
        const created: Recipe = { ...input, id: newId('custom'), isPreset: false };
        set((state) => ({ customRecipes: [...state.customRecipes, created] }));
        return created;
      },
      updateCustomRecipe: (id, input) =>
        set((state) => ({
          customRecipes: state.customRecipes.map((r) => (r.id === id ? { ...input, id, isPreset: false } : r)),
        })),
      deleteCustomRecipe: (id) =>
        set((state) => ({ customRecipes: state.customRecipes.filter((r) => r.id !== id) })),
      duplicateRecipe: (source) => {
        const copy: Recipe = {
          ...source,
          id: newId('custom'),
          isPreset: false,
          name: withCopySuffix(source.name),
          ingredients: source.ingredients.map((ri) => ({ ...ri })),
          steps: {
            ...(source.steps.ja ? { ja: [...source.steps.ja] } : {}),
            ...(source.steps.en ? { en: [...source.steps.en] } : {}),
          },
        };
        set((state) => ({ customRecipes: [...state.customRecipes, copy] }));
        return copy;
      },

      addToShopping: (ingredientId) =>
        set((state) =>
          state.shoppingList.some((item) => item.ingredientId === ingredientId)
            ? {}
            : { shoppingList: [...state.shoppingList, { ingredientId, addedOn: todayIso() }] },
        ),
      removeFromShopping: (ingredientId) =>
        set((state) => ({ shoppingList: state.shoppingList.filter((item) => item.ingredientId !== ingredientId) })),
      markBought: (ingredientId) => {
        get().removeFromShopping(ingredientId);
        get().addPantryItem(ingredientId);
      },

      importState: (state) => set({ ...state, schemaVersion: CURRENT_SCHEMA_VERSION }),
      resetAll: () => set({ ...defaultPersistedState(get().language) }),
    }),
    {
      name: STORAGE_KEY,
      version: CURRENT_SCHEMA_VERSION,
      storage: createJSONStorage(resolveStorage),
      partialize: (store) => pickPersisted(store),
      migrate: (persisted, version) => migrate(persisted, version),
    },
  ),
);
