'use strict';

import protectedResourceMetadataHandler from '../../src/handlers/protected.resource.metadata.handler';
import {buildFixture, issuer, resource} from '../helpers/handler.fixtures';

describe('protected.resource.metadata.handler tests', () => {
	it('should be defined', () => {
		expect(protectedResourceMetadataHandler).toBeDefined();
		expect(typeof protectedResourceMetadataHandler).toBe('function');
	});

	it('should describe the protected resource', async () => {
		const {context} = await buildFixture();

		const response = await protectedResourceMetadataHandler(context);

		expect(response.status).toBe(200);
		expect(response.headers['content-type']).toBe('application/json');
		expect(response.body).toEqual({resource, authorization_servers: [issuer], bearer_methods_supported: ['header']});
	});
});
