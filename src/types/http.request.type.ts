'use strict';

type HttpRequestType = {
	method: string;
	path: string;
	query: Record<string, string | string[] | undefined>;
	headers: Record<string, string | string[] | undefined>;
	body?: unknown;
	ip?: string;
};
export default HttpRequestType;
