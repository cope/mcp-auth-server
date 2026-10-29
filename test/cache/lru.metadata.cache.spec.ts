'use strict';

import LruMetadataCache from '../../src/cache/lru.metadata.cache';

const metadata = (id: string) => ({client_id: id, client_name: id, redirect_uris: ['https://x.test/cb']});

describe('lru.metadata.cache tests', () => {
	let time: number;
	const clock = () => time;

	beforeEach(() => {
		time = 1000;
	});

	it('should be defined', () => {
		expect(LruMetadataCache).toBeDefined();
	});

	it('should work with default constructor arguments', async () => {
		const cache = new LruMetadataCache();
		await cache.set('a', metadata('a'), 60);
		expect(await cache.get('a')).toEqual(metadata('a'));
	});

	it('should return undefined on miss', async () => {
		expect(await new LruMetadataCache(2, clock).get('missing')).toBeUndefined();
	});

	it('should return a hit before expiry and delete it after expiry', async () => {
		const cache = new LruMetadataCache(2, clock);
		await cache.set('a', metadata('a'), 1);
		time += 999;
		expect(await cache.get('a')).toEqual(metadata('a'));
		time += 1;
		expect(await cache.get('a')).toBeUndefined();
		expect(await cache.get('a')).toBeUndefined();
	});

	it('should evict the least recently used entry', async () => {
		const cache = new LruMetadataCache(2, clock);
		await cache.set('a', metadata('a'), 60);
		await cache.set('b', metadata('b'), 60);
		await cache.get('a');
		await cache.set('c', metadata('c'), 60);
		expect(await cache.get('b')).toBeUndefined();
		expect(await cache.get('a')).toBeDefined();
		expect(await cache.get('c')).toBeDefined();
	});

	it('should overwrite the same key without evicting', async () => {
		const cache = new LruMetadataCache(2, clock);
		await cache.set('a', metadata('a'), 60);
		await cache.set('b', metadata('b'), 60);
		await cache.set('a', metadata('a2'), 60);
		expect((await cache.get('a'))?.client_name).toBe('a2');
		expect(await cache.get('b')).toBeDefined();
	});
});
