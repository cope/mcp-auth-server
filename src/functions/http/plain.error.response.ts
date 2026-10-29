'use strict';

import type HttpResponseType from '../../types/http.response.type';

const plainErrorResponse = (status: number, message: string): HttpResponseType => ({status, headers: {'content-type': 'text/plain', 'cache-control': 'no-store'}, body: message});
export default plainErrorResponse;
