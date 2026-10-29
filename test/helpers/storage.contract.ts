'use strict';

import type IStorage from '../../src/types/i.storage';
import storageScenarios from './storage.scenarios';

export const storageContract = (name: string, create: () => Promise<IStorage>, cleanup?: () => Promise<void>): void => {
	describe(`storage contract: ${name}`, () => {
		let storage: IStorage;

		beforeEach(async () => {
			storage = await create();
		});

		for (const scenario of storageScenarios) it(scenario.name, async () => expect(scenario.run(storage)).resolves.toBeUndefined());

		if (cleanup) it('cleans up', cleanup);
	});
};
