'use strict';

import type {ServerResponse} from 'node:http';

import writeNodeResponse from '../../../src/adapters/node/write.node.response';

describe('write.node.response tests', () => {
	const fakeResponse = () => {
		const res = {writeHead: jest.fn(), end: jest.fn()};
		return {res, asServerResponse: res as unknown as ServerResponse};
	};

	it('should be defined', () => {
		expect(writeNodeResponse).toBeDefined();
		expect(typeof writeNodeResponse).toBe('function');
	});

	it('should end without payload when the body is undefined', () => {
		const {res, asServerResponse} = fakeResponse();

		writeNodeResponse(asServerResponse, {status: 302, headers: {location: 'https://a.test/'}});

		expect(res.writeHead).toHaveBeenCalledWith(302, {location: 'https://a.test/'});
		expect(res.end).toHaveBeenCalledWith(undefined);
	});

	it('should write string bodies unchanged', () => {
		const {res, asServerResponse} = fakeResponse();

		writeNodeResponse(asServerResponse, {status: 200, headers: {}, body: '<p>hi</p>'});

		expect(res.end).toHaveBeenCalledWith('<p>hi</p>');
	});

	it('should serialize object bodies as JSON', () => {
		const {res, asServerResponse} = fakeResponse();

		writeNodeResponse(asServerResponse, {status: 200, headers: {'content-type': 'application/json'}, body: {ok: true}});

		expect(res.end).toHaveBeenCalledWith('{"ok":true}');
	});
});
