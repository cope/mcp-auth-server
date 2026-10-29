'use strict';

import type HttpRequestType from '../../types/http.request.type';
import headerValue from '../http/header.value';

const hasCredentials = (request: HttpRequestType, params: Record<string, unknown>): boolean =>
	undefined !== params.client_secret || !!headerValue(request.headers, 'authorization');
export default hasCredentials;
