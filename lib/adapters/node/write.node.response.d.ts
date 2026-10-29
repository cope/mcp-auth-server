import type { ServerResponse } from 'node:http';
import type HttpResponseType from '../../types/http.response.type';
declare const writeNodeResponse: (res: ServerResponse, response: HttpResponseType) => void;
export default writeNodeResponse;
