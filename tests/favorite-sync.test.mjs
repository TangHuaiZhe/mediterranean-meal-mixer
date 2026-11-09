import assert from 'node:assert/strict';
import { build } from 'esbuild';
const result = await build({ entryPoints: ['src/favorite-sync.ts', 'src/favorites.ts'], bundle: true, format: 'esm', write: false, outdir: 'x' });
const modules = {};
for (const file of result.outputFiles) modules[file.path.endsWith('favorite-sync.js') ? 'sync' : 'favorites'] = await import('data:text/javascript;base64,' + Buffer.from(file.contents).toString('base64'));
const { FavoriteSync } = modules.sync;
const { favoriteSignature, normalizeFavorites } = modules.favorites;
const broccoli = { ids: ['broccoli'], grams: {} };
const tomato = { ids: ['tomato'], grams: {} };
assert.equal(favoriteSignature({ ids: ['tomato', 'broccoli'], grams: {} }), favoriteSignature({ ids: ['broccoli', 'tomato'], grams: {} }));
assert.equal(normalizeFavorites([['broccoli'], ['broccoli'], { ids: ['bad'], grams: {} }]).length, 1);
const values = new Map();
const store = { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
const records = new Map();
let offline = false;
const api = {
  async list(user) { if (offline) throw Error('offline'); return [...(records.get(user)?.values() ?? [])]; },
  async add(user, signature, favorite) { if (offline) throw Error('offline'); if (!records.has(user)) records.set(user, new Map()); records.get(user).set(signature, favorite); },
  async delete(user, signature) { if (offline) throw Error('offline'); records.get(user)?.delete(signature); },
};
let current = [];
const statuses = [];
const sync = new FavoriteSync(api, store, favorites => current = favorites, message => statuses.push(message));
await sync.start('alice', [broccoli]);
assert.equal(records.get('alice').size, 1, 'legacy favorite migrated');
offline = true;
sync.add(tomato);
await sync.sync();
assert.equal(current.length, 2, 'offline change remains visible');
assert.match(statuses.at(-1), /重试/);
sync.stop();
assert.equal(values.has('mediterranean-cloud-queue-alice'), true);
offline = false;
await sync.start('alice', []);
assert.equal(records.get('alice').size, 2, 'queued change uploaded');
assert.equal(current.length, 2);
sync.remove(broccoli);
await sync.sync();
assert.equal(records.get('alice').size, 1);
sync.stop();
await sync.start('bob', []);
assert.equal(current.length, 0, 'accounts isolated');
sync.add(broccoli);
await sync.sync();
assert.equal(records.get('bob').size, 1);
assert.equal(records.get('alice').size, 1);
console.log('通过：收藏规范化、旧收藏迁移、断网队列、删除和账户隔离。');
