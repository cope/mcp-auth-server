'use strict';

import type HttpRequestType from '../../types/http.request.type';

const headerValue = (headers: HttpRequestType['headers'], name: string): string | undefined => {
	const value: string | string[] | undefined = headers[name] ?? headers[name.toLowerCase()];
	return Array.isArray(value) ? value[0] : value;
};
export default headerValue;
