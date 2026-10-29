'use strict';

import rowToClient from '../../../src/functions/sql/row.to.client';

const row = {
	client_id: 'c1',
	client_name: 'Name',
	redirect_uris: '["https://a/cb"]',
	application_type: 'native',
	token_endpoint_auth_method: 'none',
	grant_types: '["authorization_code"]',
	response_types: '["code"]',
	created_at: '1000'
};

describe('row.to.client tests', () => {
	it('should be defined', () => {
		expect(rowToClient).toBeDefined();
	});

	it('should map a full row', () => {
		expect(rowToClient(row)).toEqual({
			clientId: 'c1',
			clientName: 'Name',
			redirectUris: ['https://a/cb'],
			applicationType: 'native',
			tokenEndpointAuthMethod: 'none',
			grantTypes: ['authorization_code'],
			responseTypes: ['code'],
			createdAt: new Date(1000)
		});
	});

	it('should map null optionals to undefined', () => {
		const mapped = rowToClient({...row, client_name: null, application_type: null});
		expect(mapped.clientName).toBeUndefined();
		expect(mapped.applicationType).toBeUndefined();
	});
});
