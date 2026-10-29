'use strict';

import escapeHtml from '../../../src/functions/consent/escape.html';

describe('escape.html tests', () => {
	it('should be defined', () => {
		expect(escapeHtml).toBeDefined();
		expect(typeof escapeHtml).toBe('function');
	});

	it('should escape all special characters', () => {
		expect(escapeHtml(`<a href="x" title='y'>&</a>`)).toBe('&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;&amp;&lt;/a&gt;');
	});

	it('should leave safe text unchanged', () => {
		expect(escapeHtml('plain text 123')).toBe('plain text 123');
	});
});
