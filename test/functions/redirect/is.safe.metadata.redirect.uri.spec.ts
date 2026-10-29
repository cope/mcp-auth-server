'use strict';

import isSafeMetadataRedirectUri from '../../../src/functions/redirect/is.safe.metadata.redirect.uri';

describe('is.safe.metadata.redirect.uri tests', () => {
	it('should be defined', () => {
		expect(isSafeMetadataRedirectUri).toBeDefined();
		expect(typeof isSafeMetadataRedirectUri).toBe('function');
	});

	it('should reject non strings and invalid urls', () => {
		expect(isSafeMetadataRedirectUri(undefined)).toBe(false);
		expect(isSafeMetadataRedirectUri('nope')).toBe(false);
	});

	it('should reject uris containing a fragment', () => {
		expect(isSafeMetadataRedirectUri('https://example.com/cb#x')).toBe(false);
	});

	it('should allow http only for loopback', () => {
		expect(isSafeMetadataRedirectUri('http://localhost/cb')).toBe(true);
		expect(isSafeMetadataRedirectUri('http://example.com/cb')).toBe(false);
	});

	it('should allow any https host', () => {
		expect(isSafeMetadataRedirectUri('https://example.com/cb')).toBe(true);
	});

	it('should reject dangerous schemes', () => {
		expect(isSafeMetadataRedirectUri('javascript:alert(1)')).toBe(false);
		expect(isSafeMetadataRedirectUri('data:text/html,x')).toBe(false);
	});

	it('should allow other custom schemes', () => {
		expect(isSafeMetadataRedirectUri('cursor://app/cb')).toBe(true);
	});
});
