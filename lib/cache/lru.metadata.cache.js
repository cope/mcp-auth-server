'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
class LruMetadataCache {
    maxEntries;
    now;
    entries = new Map();
    constructor(maxEntries = 500, now = Date.now) {
        this.maxEntries = maxEntries;
        this.now = now;
    }
    async get(url) {
        const entry = this.entries.get(url);
        if (!entry)
            return undefined;
        if (entry.expiresAt <= this.now()) {
            this.entries.delete(url);
            return undefined;
        }
        this.entries.delete(url);
        this.entries.set(url, entry);
        return entry.value;
    }
    async set(url, value, ttlSeconds) {
        this.entries.delete(url);
        this.entries.set(url, { value, expiresAt: this.now() + ttlSeconds * 1000 });
        while (this.entries.size > this.maxEntries)
            this.entries.delete(this.entries.keys().next().value);
    }
}
exports.default = LruMetadataCache;
//# sourceMappingURL=lru.metadata.cache.js.map