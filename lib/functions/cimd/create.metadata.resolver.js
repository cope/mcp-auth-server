'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_public_host_1 = __importDefault(require("./assert.public.host"));
const cache_seconds_1 = __importDefault(require("./cache.seconds"));
const host_matches_1 = __importDefault(require("./host.matches"));
const read_limited_1 = __importDefault(require("./read.limited"));
const validate_metadata_document_1 = __importDefault(require("./validate.metadata.document"));
const createMetadataResolver = (options, cache) => {
    const fetchImpl = options.fetch ?? ((input, init) => fetch(input, init));
    const timeoutMs = options.timeoutMs ?? 5000;
    const maxBytes = options.maxBytes ?? 5120;
    const maxCacheSeconds = options.maxCacheSeconds ?? 3600;
    const defaultCacheSeconds = options.defaultCacheSeconds ?? 300;
    return async (clientId) => {
        try {
            const url = new URL(clientId);
            const host = url.hostname.toLowerCase();
            if (options.trust?.denyHosts && (0, host_matches_1.default)(host, options.trust.denyHosts))
                throw new Error('client host is denied');
            if (options.trust?.allowHosts && !(0, host_matches_1.default)(host, options.trust.allowHosts))
                throw new Error('client host is not allowed');
            const cached = await cache.get(clientId);
            if (cached)
                return { ok: true, metadata: cached };
            (0, assert_public_host_1.default)(url);
            await options.guard?.(url);
            const response = await fetchImpl(clientId, { redirect: 'manual', headers: { accept: 'application/json' }, signal: AbortSignal.timeout(timeoutMs) });
            if (200 !== response.status)
                throw new Error(`client metadata fetch returned status ${response.status}`);
            const text = await (0, read_limited_1.default)(response, maxBytes);
            let parsed;
            try {
                parsed = JSON.parse(text);
            }
            catch {
                throw new Error('client metadata document is not valid JSON');
            }
            const metadata = (0, validate_metadata_document_1.default)(parsed, clientId);
            const seconds = (0, cache_seconds_1.default)(response.headers.get('cache-control'), maxCacheSeconds, defaultCacheSeconds);
            if (seconds > 0)
                await cache.set(clientId, metadata, seconds);
            return { ok: true, metadata };
        }
        catch (error) {
            return { ok: false, reason: error instanceof Error ? error.message : 'client metadata fetch failed' };
        }
    };
};
exports.default = createMetadataResolver;
//# sourceMappingURL=create.metadata.resolver.js.map