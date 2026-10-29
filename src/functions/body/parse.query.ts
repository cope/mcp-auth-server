'use strict';

const parseQuery = (search: string | URLSearchParams): Record<string, string | string[]> => {
	const params: URLSearchParams = 'string' === typeof search ? new URLSearchParams(search) : search;
	const query: Record<string, string | string[]> = {};
	for (const [key, value] of params) {
		const existing: string | string[] | undefined = query[key];
		if (undefined === existing) query[key] = value;
		else query[key] = ([] as string[]).concat(existing, value);
	}
	return query;
};
export default parseQuery;
