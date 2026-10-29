'use strict';

import McpAuthServer, {
	LruMetadataCache,
	appSessionUpstream,
	assertPublicHost,
	createMcpAuth,
	escapeHtml,
	isMetadataClientId,
	normalizePem,
	oidcUpstream,
	parseBody,
	parseQuery,
	renderDefaultConsent,
	sha256Hex,
	signingKeyFromEnv
} from '../src/mcp.auth.server';

describe('mcp.auth.server tests', () => {
	it('should be defined', () => {
		expect(McpAuthServer).toBeDefined();
		expect(typeof McpAuthServer).toBe('object');
	});

	it('should export the server functions', () => {
		expect(typeof createMcpAuth).toBe('function');
		expect(typeof oidcUpstream).toBe('function');
		expect(typeof appSessionUpstream).toBe('function');
		expect(typeof assertPublicHost).toBe('function');
		expect(typeof isMetadataClientId).toBe('function');
		expect(typeof renderDefaultConsent).toBe('function');
		expect(typeof escapeHtml).toBe('function');
		expect(typeof normalizePem).toBe('function');
		expect(typeof signingKeyFromEnv).toBe('function');
		expect(typeof parseBody).toBe('function');
		expect(typeof parseQuery).toBe('function');
		expect(typeof sha256Hex).toBe('function');
	});

	it('should export a constructable LruMetadataCache', () => {
		expect(typeof LruMetadataCache).toBe('function');
		expect(new LruMetadataCache(1)).toBeInstanceOf(LruMetadataCache);
	});
});
