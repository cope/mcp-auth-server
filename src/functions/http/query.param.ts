'use strict';

import type HttpRequestType from '../../types/http.request.type';

const queryParam = (request: HttpRequestType, name: string): string | undefined => {
	const value: string | string[] | undefined = request.query[name];
	return 'string' === typeof value ? value : undefined;
};
export default queryParam;
