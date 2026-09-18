import { describe, expect, it } from 'vitest';
import { makeIngredient, makePantryItem } from '../../test/factories';
import { groupPantryByCategory } from './groupPantry';

describe('groupPantryByCategory', () => {
  it('groups by category in canonical order, sorts by name, and routes unknowns to other', () => {
    const egg = makeIngredient({ id: 'egg', category: 'egg_dairy', name: { ja: '卵', en: 'Egg' } });
    const onion = makeIngredient({ id: 'onion', category: 'vegetable', name: { ja: '玉ねぎ', en: 'Onion' } });
    const carrot = makeIngredient({ id: 'carrot', category: 'vegetable', name: { ja: 'にんじん', en: 'Carrot' } });
    const lookup = (id: string) => [egg, onion, carrot].find((i) => i.id === id);
    const groups = groupPantryByCategory(
      [makePantryItem('egg'), makePantryItem('onion'), makePantryItem('ghost'), makePantryItem('carrot')],
      lookup,
      'en',
    );
    expect(groups.map((g) => g.category)).toEqual(['vegetable', 'egg_dairy', 'other']);
    expect(groups[0].rows.map((r) => r.item.ingredientId)).toEqual(['carrot', 'onion']);
    expect(groups[2].rows[0].ingredient).toBeUndefined();
  });
});
