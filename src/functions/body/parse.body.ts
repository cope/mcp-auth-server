'use strict';

const parseBody = (contentType: string | undefined, raw: string): unknown => {
	if (!raw) return undefined;
	const type: string = (contentType ?? '').toLowerCase();
	if (type.includes('application/x-www-form-urlencoded')) return Object.fromEntries(new URLSearchParams(raw));
	if (type.includes('json') || !type) {
		try {
			return JSON.parse(raw);
		} catch {
			return undefined;
		}
	}
	return undefined;
};
export default parseBody;
