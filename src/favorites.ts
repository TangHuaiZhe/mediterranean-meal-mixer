import { ingredients, baseOil } from './data';
import { weightRange } from './engine';

export type Favorite = { ids: string[]; grams: Record<string, number> };
const allIngredients = [...ingredients, baseOil];
const byId = new Map(allIngredients.map(item => [item.id, item]));

export function normalizeGrams(raw: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  for (const [id, value] of Object.entries(raw)) {
    const item = byId.get(id);
    if (!item) continue;
    const [min, max] = weightRange(item);
    if (typeof value === 'number' && Number.isInteger(value) && value >= min && value <= max) out[id] = value;
  }
  return out;
}

export function normalizeFavorite(raw: unknown): Favorite | null {
  const value = Array.isArray(raw) ? { ids: raw, grams: {} } : raw;
  if (!value || typeof value !== 'object' || !('ids' in value) || !Array.isArray(value.ids)) return null;
  const ids = [...new Set(value.ids.filter((id): id is string => typeof id === 'string' && id !== 'olive' && byId.has(id)))];
  if (!ids.length || ids.length > ingredients.length) return null;
  const grams = normalizeGrams('grams' in value ? value.grams : {});
  return { ids, grams };
}

export function normalizeFavorites(raw: unknown): Favorite[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const result: Favorite[] = [];
  for (const entry of raw) {
    const favorite = normalizeFavorite(entry);
    if (!favorite) continue;
    const signature = favoriteSignature(favorite);
    if (seen.has(signature)) continue;
    seen.add(signature);
    result.push(favorite);
  }
  return result.slice(0, 100);
}

export function favoriteSignature(favorite: Favorite): string {
  const ids = [...new Set(favorite.ids)].filter(id => id !== 'olive' && byId.has(id)).sort();
  const grams = Object.fromEntries([...ids, 'olive'].map(id => [id, favorite.grams[id] ?? byId.get(id)!.grams]));
  return JSON.stringify({ ids, grams });
}
