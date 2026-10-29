'use strict';

import validateMetadataDocument from '../../../src/functions/cimd/validate.metadata.document';

const url = 'https://client.example/meta.json';
const valid = () => ({client_id: url, client_name: 'Client', redirect_uris: ['https://client.example/cb']});

describe('validate.metadata.document tests', () => {
	it('should be defined', () => {
		expect(validateMetadataDocument).toBeDefined();
	});

	it('should return a valid document', () => {
		const doc = {...valid(), token_endpoint_auth_method: 'none'};
		expect(validateMetadataDocument(doc, url)).toBe(doc);
		expect(validateMetadataDocument(valid(), url)).toBeDefined();
	});

	it.each([null, 'str', 5, []])('should reject non-object %p', (doc) => {
		expect(() => validateMetadataDocument(doc, url)).toThrow('client metadata document must be a JSON object');
	});

	it('should reject a client_id mismatch', () => {
		expect(() => validateMetadataDocument({...valid(), client_id: 'other'}, url)).toThrow('client_id in the metadata document does not match its URL');
	});

	it.each([undefined, 5, '   '])('should reject client_name %p', (name) => {
		expect(() => validateMetadataDocument({...valid(), client_name: name}, url)).toThrow('client metadata document requires client_name');
	});

	it.each([undefined, 'x', [], ['javascript:alert(1)'], ['http://evil.example/cb']])('should reject redirect_uris %p', (uris) => {
		expect(() => validateMetadataDocument({...valid(), redirect_uris: uris}, url)).toThrow('client metadata document requires valid redirect_uris');
	});

	it('should reject client secrets', () => {
		expect(() => validateMetadataDocument({...valid(), client_secret: 's'}, url)).toThrow('must not contain client secrets');
		expect(() => validateMetadataDocument({...valid(), client_secret_expires_at: 0}, url)).toThrow('must not contain client secrets');
	});

	it('should reject unsupported token_endpoint_auth_method', () => {
		expect(() => validateMetadataDocument({...valid(), token_endpoint_auth_method: 'client_secret_basic'}, url)).toThrow('only token_endpoint_auth_method none is supported');
	});
});
