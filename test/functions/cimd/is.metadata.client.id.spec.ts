'use strict';

import isMetadataClientId from '../../../src/functions/cimd/is.metadata.client.id';

describe('is.metadata.client.id tests', () => {
	it('should be defined', () => {
		expect(isMetadataClientId).toBeDefined();
	});

	it('should accept an https url with a path', () => {
		expect(isMetadataClientId('https://client.example/meta.json')).toBe(true);
	});

	it.each([
		'not a url',
		'http://client.example/meta.json',
		'https://client.example',
		'https://client.example/',
		'https://client.example/m#frag',
		'https://u@client.example/m',
		'https://u:p@client.example/m',
		'https://CLIENT.example/m'
	])('should reject %s', (value) => {
		expect(isMetadataClientId(value)).toBe(false);
	});
});
