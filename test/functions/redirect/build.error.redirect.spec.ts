'use strict';

import buildErrorRedirect from '../../../src/functions/redirect/build.error.redirect';
import buildRedirect from '../../../src/functions/redirect/build.redirect';

jest.mock('../../../src/functions/redirect/build.redirect');

const mockBuildRedirect = buildRedirect as jest.MockedFunction<typeof buildRedirect>;

describe('build.error.redirect tests', () => {
	it('should be defined', () => {
		expect(buildErrorRedirect).toBeDefined();
		expect(typeof buildErrorRedirect).toBe('function');
	});

	it('should delegate to buildRedirect with error params and state', () => {
		mockBuildRedirect.mockReturnValue('https://app/cb?x');

		expect(buildErrorRedirect('https://app/cb', 'https://iss', 'access_denied', 'nope', 'st')).toBe('https://app/cb?x');
		expect(mockBuildRedirect).toHaveBeenCalledWith('https://app/cb', 'https://iss', {error: 'access_denied', error_description: 'nope', state: 'st'});
	});

	it('should pass an undefined state through', () => {
		buildErrorRedirect('https://app/cb', 'https://iss', 'e', 'd');

		expect(mockBuildRedirect).toHaveBeenCalledWith('https://app/cb', 'https://iss', {error: 'e', error_description: 'd', state: undefined});
	});
});
