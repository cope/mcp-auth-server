'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const cacheSeconds = (header, maxCacheSeconds, defaultCacheSeconds) => {
    if (!header)
        return defaultCacheSeconds;
    const directives = header
        .toLowerCase()
        .split(',')
        .map((part) => part.trim());
    if (directives.some((directive) => 'no-store' === directive || 'no-cache' === directive))
        return 0;
    const maxAge = directives.map((directive) => /^max-age=(\d+)$/.exec(directive)).find(Boolean);
    return maxAge ? Math.min(Number(maxAge[1]), maxCacheSeconds) : defaultCacheSeconds;
};
exports.default = cacheSeconds;
//# sourceMappingURL=cache.seconds.js.map