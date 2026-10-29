'use strict';

import type HttpResponseType from '../../types/http.response.type';
import jsonResponse from './json.response';

const oauthErrorResponse = (status: number, error: string, description: string, headers: Record<string, string> = {}): HttpResponseType =>
	jsonResponse(status, {error, error_description: description}, headers);
export default oauthErrorResponse;
