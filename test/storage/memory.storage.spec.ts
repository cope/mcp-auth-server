'use strict';

import MemoryStorage from '../../src/storage/memory.storage';
import {storageContract} from '../helpers/storage.contract';

storageContract('memory.storage', async () => new MemoryStorage());

describe('memory.storage tests', () => {
	it('should be defined', () => {
		expect(MemoryStorage).toBeDefined();
		expect(new MemoryStorage()).toBeInstanceOf(MemoryStorage);
	});

	it('should return copies so callers cannot mutate stored records', async () => {
		const storage = new MemoryStorage();
		await storage.saveClient({clientId: 'c', redirectUris: ['x'], tokenEndpointAuthMethod: 'none', grantTypes: [], responseTypes: [], createdAt: new Date()});
		const found = await storage.getClient('c');
		found!.clientId = 'changed';
		expect((await storage.getClient('c'))?.clientId).toBe('c');
	});
});
