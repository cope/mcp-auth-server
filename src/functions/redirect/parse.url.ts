'use strict';

const parseUrl = (value: unknown): URL | null => {
	if ('string' !== typeof value) return null;
	try {
		return new URL(value);
	} catch {
		return null;
	}
};
export default parseUrl;
