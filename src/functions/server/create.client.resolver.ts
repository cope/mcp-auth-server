'use strict';

import LruMetadataCache from '../../cache/lru.metadata.cache';
import type McpAuthOptionsType from '../../types/mcp.auth.options.type';
import type ResolvedClientType from '../../types/resolved.client.type';
import createMetadataResolver from '../cimd/create.metadata.resolver';
import isMetadataClientId from '../cimd/is.metadata.client.id';

const createClientResolver = (options: McpAuthOptionsType<any>, now: () => Date, cimdEnabled: boolean): ((clientId: string) => Promise<ResolvedClientType | {error: string}>) => {
	const cache = options.cimd?.cache ?? new LruMetadataCache(500, (): number => now().getTime());
	const resolveMetadata = createMetadataResolver(options.cimd ?? {}, cache);

	return async (clientId: string): Promise<ResolvedClientType | {error: string}> => {
		if (cimdEnabled && isMetadataClientId(clientId)) {
			const resolution = await resolveMetadata(clientId);
			if (!resolution.ok) {
				options.logger?.info?.('MCP client metadata rejected', {clientId, reason: resolution.reason});
				return {error: 'client metadata document is invalid or unreachable'};
			}
			return {clientId, clientName: resolution.metadata.client_name.slice(0, 200), redirectUris: resolution.metadata.redirect_uris, metadataDocument: true};
		}
		const client = await options.storage.getClient(clientId);
		return client ? {clientId, clientName: client.clientName, redirectUris: client.redirectUris, metadataDocument: false} : {error: 'unknown client_id'};
	};
};
export default createClientResolver;
