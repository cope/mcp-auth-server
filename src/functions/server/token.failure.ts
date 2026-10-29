'use strict';

import type HttpResponseType from '../../types/http.response.type';
import oauthErrorResponse from '../http/oauth.error.response';

const tokenFailure = (error: string, description: string, status: number = 400): HttpResponseType =>
	oauthErrorResponse(status, error, description, {'cache-control': 'no-store', pragma: 'no-cache'});
export default tokenFailure;
