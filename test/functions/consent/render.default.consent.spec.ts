'use strict';

import renderDefaultConsent from '../../../src/functions/consent/render.default.consent';

describe('render.default.consent tests', () => {
	const model = {
		action: '/authorize/decision',
		state: 'state-1',
		clientId: 'client-1',
		metadataDocument: false,
		redirectUri: 'https://app.example.com/cb',
		redirectTarget: 'app.example.com',
		redirectIsLocalhost: false,
		productName: 'Product'
	};

	it('should be defined', () => {
		expect(renderDefaultConsent).toBeDefined();
		expect(typeof renderDefaultConsent).toBe('function');
	});

	it('should render a minimal model with defaults', () => {
		const html = renderDefaultConsent(model);

		expect(html).toContain('<title>Authorize An MCP client - Product</title>');
		expect(html).toContain('<form method="post" action="/authorize/decision">');
		expect(html).toContain('name="state" value="state-1"');
		expect(html).toContain('<strong>app.example.com</strong>');
		expect(html).not.toContain('class="host"');
		expect(html).not.toContain('class="env"');
		expect(html).not.toContain('class="user"');
		expect(html).not.toContain('class="warn"');
		expect(html).not.toContain('is declared by the client itself');
	});

	it('should render optional sections', () => {
		const html = renderDefaultConsent({
			...model,
			clientName: 'My <Client>',
			clientHost: 'client.example.com',
			metadataDocument: true,
			redirectIsLocalhost: true,
			userDisplayName: 'Jane',
			environmentLabel: 'dev'
		});

		expect(html).toContain('My &lt;Client&gt;');
		expect(html).toContain('<span class="host">client.example.com</span>');
		expect(html).toContain('It is identified by <strong>client.example.com</strong>');
		expect(html).toContain('(localhost)');
		expect(html).toContain('Signing in as <strong>Jane</strong>');
		expect(html).toContain('<span class="env">dev</span>');
		expect(html).toContain('Product (dev)');
	});

	it('should identify a metadata client by its id when the host is missing', () => {
		const html = renderDefaultConsent({...model, metadataDocument: true});

		expect(html).toContain('It is identified by <strong>client-1</strong>');
	});
});
