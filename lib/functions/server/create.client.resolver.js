'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const lru_metadata_cache_1 = __importDefault(require("../../cache/lru.metadata.cache"));
const create_metadata_resolver_1 = __importDefault(require("../cimd/create.metadata.resolver"));
const is_metadata_client_id_1 = __importDefault(require("../cimd/is.metadata.client.id"));
const createClientResolver = (options, now, cimdEnabled) => {
    const cache = options.cimd?.cache ?? new lru_metadata_cache_1.default(500, () => now().getTime());
    const resolveMetadata = (0, create_metadata_resolver_1.default)(options.cimd ?? {}, cache);
    return async (clientId) => {
        if (cimdEnabled && (0, is_metadata_client_id_1.default)(clientId)) {
            const resolution = await resolveMetadata(clientId);
            if (!resolution.ok) {
                options.logger?.info?.('MCP client metadata rejected', { clientId, reason: resolution.reason });
                return { error: 'client metadata document is invalid or unreachable' };
            }
            return { clientId, clientName: resolution.metadata.client_name.slice(0, 200), redirectUris: resolution.metadata.redirect_uris, metadataDocument: true };
        }
        const client = await options.storage.getClient(clientId);
        return client ? { clientId, clientName: client.clientName, redirectUris: client.redirectUris, metadataDocument: false } : { error: 'unknown client_id' };
    };
};
exports.default = createClientResolver;
//# sourceMappingURL=create.client.resolver.js.map