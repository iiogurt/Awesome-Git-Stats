/** Tiny in-memory TTL cache with a size cap, shared within a server instance. */
export class TtlCache {
  constructor({ ttlMs = 10 * 60 * 1000, maxEntries = 500 } = {}) {
    this.ttlMs = ttlMs;
    this.maxEntries = maxEntries;
    this.entries = new Map();
  }

  get(key) {
    const entry = this.entries.get(key);
    if (!entry) return undefined;
    if (entry.expires < Date.now()) {
      this.entries.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key, value, ttlMs = this.ttlMs) {
    if (this.entries.size >= this.maxEntries) {
      // Maps keep insertion order, so the first key is the oldest.
      this.entries.delete(this.entries.keys().next().value);
    }
    this.entries.set(key, { value, expires: Date.now() + ttlMs });
  }

  delete(key) {
    this.entries.delete(key);
  }

  clear() {
    this.entries.clear();
  }
}
