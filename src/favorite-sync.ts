import { favoriteSignature, normalizeFavorite, normalizeFavorites, type Favorite } from './favorites';

type Operation = { kind: 'add'; signature: string; favorite: Favorite } | { kind: 'delete'; signature: string };
export type FavoriteCloudApi = {
  list: (userId: string) => Promise<Array<{ ids: string[]; grams: Record<string, number> }>>;
  add: (userId: string, signature: string, favorite: Favorite) => Promise<void>;
  delete: (userId: string, signature: string) => Promise<void>;
};
type Store = Pick<Storage, 'getItem' | 'setItem'>;

function readJson(store: Store, key: string): unknown {
  try { return JSON.parse(store.getItem(key) ?? 'null'); } catch { return null; }
}
function writeJson(store: Store, key: string, value: unknown): void {
  try { store.setItem(key, JSON.stringify(value)); } catch { /* 会话内仍可继续使用 */ }
}
function normalizeQueue(raw: unknown): Operation[] {
  if (!Array.isArray(raw)) return [];
  const result: Operation[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object' || typeof item.signature !== 'string') continue;
    if (item.kind === 'delete') result.push({ kind: 'delete', signature: item.signature });
    if (item.kind === 'add') {
      const favorite = normalizeFavorite(item.favorite);
      if (favorite && favoriteSignature(favorite) === item.signature) result.push({ kind: 'add', signature: item.signature, favorite });
    }
  }
  return result.slice(-200);
}

export class FavoriteSync {
  private userId: string | null = null;
  private favorites: Favorite[] = [];
  private queue: Operation[] = [];
  private syncing: Promise<void> | null = null;
  private generation = 0;

  constructor(private api: FavoriteCloudApi, private store: Store, private onChange: (favorites: Favorite[]) => void, private onStatus: (message: string) => void) {}

  private cacheKey(userId: string): string { return `mediterranean-cloud-favorites-${userId}`; }
  private queueKey(userId: string): string { return `mediterranean-cloud-queue-${userId}`; }
  private save(): void {
    if (!this.userId) return;
    writeJson(this.store, this.cacheKey(this.userId), this.favorites);
    writeJson(this.store, this.queueKey(this.userId), this.queue);
    this.onChange([...this.favorites]);
  }

  start(userId: string, anonymousFavorites: Favorite[]): Promise<void> {
    if (this.userId === userId) return this.sync();
    this.generation++;
    this.userId = userId;
    this.favorites = normalizeFavorites(readJson(this.store, this.cacheKey(userId)));
    this.queue = normalizeQueue(readJson(this.store, this.queueKey(userId)));
    for (const favorite of anonymousFavorites) this.add(favorite, false);
    this.save();
    return this.sync();
  }

  stop(): void {
    this.generation++;
    this.userId = null;
    this.favorites = [];
    this.queue = [];
    this.syncing = null;
  }

  add(raw: Favorite, autoSync = true): void {
    if (!this.userId) return;
    const favorite = normalizeFavorite(raw);
    if (!favorite) return;
    const signature = favoriteSignature(favorite);
    if (!this.favorites.some(f => favoriteSignature(f) === signature)) this.favorites.unshift(favorite);
    this.favorites = this.favorites.slice(0, 100);
    if (!this.queue.some(item => item.kind === 'add' && item.signature === signature)) this.queue.push({ kind: 'add', signature, favorite });
    this.save();
    if (autoSync) void this.sync();
  }

  remove(favorite: Favorite): void {
    if (!this.userId) return;
    const signature = favoriteSignature(favorite);
    this.favorites = this.favorites.filter(f => favoriteSignature(f) !== signature);
    this.queue.push({ kind: 'delete', signature });
    this.save();
    void this.sync();
  }

  sync(): Promise<void> {
    if (!this.userId) return Promise.resolve();
    if (this.syncing) return this.syncing;
    const userId = this.userId;
    const generation = this.generation;
    this.onStatus('正在同步收藏…');
    const task = this.run(userId, generation).then(() => { if (this.generation === generation) this.onStatus('收藏已同步。'); }).catch(() => { if (this.generation === generation) this.onStatus('暂时无法同步；更改已在当前页面保留，联网后可重试。'); }).finally(() => { if (this.syncing === task) this.syncing = null; });
    this.syncing = task;
    return task;
  }

  private async run(userId: string, generation: number): Promise<void> {
    while (this.generation === generation) {
      while (this.queue.length && this.generation === generation) {
        const operation = this.queue[0];
        if (operation.kind === 'add') await this.api.add(userId, operation.signature, operation.favorite);
        else await this.api.delete(userId, operation.signature);
        if (this.generation !== generation) return;
        this.queue.shift();
        this.save();
      }
      if (this.generation !== generation) return;
      const remote = normalizeFavorites(await this.api.list(userId));
      if (this.generation !== generation) return;
      if (this.queue.length) continue;
      this.favorites = remote;
      this.save();
      return;
    }
  }
}
