'use strict';

import type CimdOptionsType from '../../types/cimd.options.type';
import type IMetadataCache from '../../types/i.metadata.cache';
import type MetadataResolutionType from '../../types/metadata.resolution.type';
import assertPublicHost from './assert.public.host';
import cacheSeconds from './cache.seconds';
import hostMatches from './host.matches';
import readLimited from './read.limited';
import validateMetadataDocument from './validate.metadata.document';

const createMetadataResolver = (options: CimdOptionsType, cache: IMetadataCache): ((clientId: string) => Promise<MetadataResolutionType>) => {
	const fetchImpl: typeof fetch = options.fetch ?? ((input: any, init?: RequestInit): Promise<Response> => fetch(input, init));
	const timeoutMs: number = options.timeoutMs ?? 5000;
	const maxBytes: number = options.maxBytes ?? 5120;
	const maxCacheSeconds: number = options.maxCacheSeconds ?? 3600;
	const defaultCacheSeconds: number = options.defaultCacheSeconds ?? 300;

	return async (clientId: string): Promise<MetadataResolutionType> => {
		try {
			const url: URL = new URL(clientId);
			const host: string = url.hostname.toLowerCase();
			if (options.trust?.denyHosts && hostMatches(host, options.trust.denyHosts)) throw new Error('client host is denied');
			if (options.trust?.allowHosts && !hostMatches(host, options.trust.allowHosts)) throw new Error('client host is not allowed');

			const cached = await cache.get(clientId);
			if (cached) return {ok: true, metadata: cached};

			assertPublicHost(url);
			await options.guard?.(url);

			const response: Response = await fetchImpl(clientId, {redirect: 'manual', headers: {accept: 'application/json'}, signal: AbortSignal.timeout(timeoutMs)});
			if (200 !== response.status) throw new Error(`client metadata fetch returned status ${response.status}`);
			const text: string = await readLimited(response, maxBytes);
			let parsed: unknown;
			try {
				parsed = JSON.parse(text);
			} catch {
				throw new Error('client metadata document is not valid JSON');
			}
			const metadata = validateMetadataDocument(parsed, clientId);

			const seconds: number = cacheSeconds(response.headers.get('cache-control'), maxCacheSeconds, defaultCacheSeconds);
			if (seconds > 0) await cache.set(clientId, metadata, seconds);
			return {ok: true, metadata};
		} catch (error) {
			return {ok: false, reason: error instanceof Error ? error.message : 'client metadata fetch failed'};
		}
	};
};
export default createMetadataResolver;
