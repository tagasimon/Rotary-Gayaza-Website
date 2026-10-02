// Tiny in-process TTL cache for public content. Admin writes call invalidateContent().
// Suitable for a single-container deployment (the Coolify default). Keeps Date objects intact.
const store = new Map<string, { at: number; value: unknown }>();
const TTL = Number(process.env.CONTENT_CACHE_SECONDS ?? 120) * 1000;

export async function cached<T>(key: string, fn: () => Promise<T>, ttl = TTL): Promise<T> {
  if (ttl <= 0) return fn();
  const hit = store.get(key);
  if (hit && Date.now() - hit.at < ttl) return hit.value as T;
  const value = await fn();
  store.set(key, { at: Date.now(), value });
  return value;
}

export function invalidateContent() {
  store.clear();
}
