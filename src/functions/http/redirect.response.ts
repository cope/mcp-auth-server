'use strict';

import type HttpResponseType from '../../types/http.response.type';

const redirectResponse = (location: string): HttpResponseType => ({status: 302, headers: {location, 'cache-control': 'no-store'}});
export default redirectResponse;
