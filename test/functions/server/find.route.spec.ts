'use strict';

import findRoute from '../../../src/functions/server/find.route';
import type RouteType from '../../../src/types/route.type';

const handler = jest.fn();
const routes: RouteType[] = [
	{method: 'GET', path: '/a', name: 'authorize', handler},
	{method: 'POST', path: '/a', name: 'token', handler}
];

describe('find.route tests', () => {
	it('should be defined', () => {
		expect(findRoute).toBeDefined();
		expect(typeof findRoute).toBe('function');
	});

	it('should match method case-insensitively', () => {
		expect(findRoute(routes, {method: 'post', path: '/a', query: {}, headers: {}})).toBe(routes[1]);
		expect(findRoute(routes, {method: 'get', path: '/a', query: {}, headers: {}})).toBe(routes[0]);
	});

	it('should return undefined for unknown path or method', () => {
		expect(findRoute(routes, {method: 'GET', path: '/b', query: {}, headers: {}})).toBeUndefined();
		expect(findRoute(routes, {method: 'DELETE', path: '/a', query: {}, headers: {}})).toBeUndefined();
	});
});
