'use strict';

import authorizationServerMetadataHandler from '../../src/handlers/authorization.server.metadata.handler';
import {buildFixture, issuer} from '../helpers/handler.fixtures';

describe('authorization.server.metadata.handler tests', () => {
	it('should be defined', () => {
		expect(authorizationServerMetadataHandler).toBeDefined();
		expect(typeof authorizationServerMetadataHandler).toBe('function');
	});

	it('should describe the server with registration and CIMD enabled', async () => {
		const {context} = await buildFixture();

		const response = await authorizationServerMetadataHandler(context);

		expect(response.status).toBe(200);
		expect(response.headers['content-type']).toBe('application/json');
		expect(response.body).toEqual({
			issuer,
			authorization_endpoint: `${issuer}/authorize`,
			token_endpoint: `${issuer}/token`,
			registration_endpoint: `${issuer}/register`,
			revocation_endpoint: `${issuer}/revoke`,
			response_types_supported: ['code'],
			grant_types_supported: ['authorization_code', 'refresh_token'],
			code_challenge_methods_supported: ['S256'],
			token_endpoint_auth_methods_supported: ['none'],
			authorization_response_iss_parameter_supported: true,
			client_id_metadata_document_supported: true
		});
	});

	it('should omit registration_endpoint when registration is disabled', async () => {
		const {context} = await buildFixture({context: {registrationEnabled: false}});

		const response = await authorizationServerMetadataHandler(context);

		expect(response.body).not.toHaveProperty('registration_endpoint');
		expect(response.body).toHaveProperty('authorization_response_iss_parameter_supported', true);
	});

	it('should omit client_id_metadata_document_supported when CIMD is disabled', async () => {
		const {context} = await buildFixture({context: {cimdEnabled: false}});

		const response = await authorizationServerMetadataHandler(context);

		expect(response.body).not.toHaveProperty('client_id_metadata_document_supported');
		expect(response.body).toHaveProperty('registration_endpoint');
	});
});
