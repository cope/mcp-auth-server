import type { IncomingMessage } from 'node:http';
import type HttpRequestType from '../../types/http.request.type';
declare const toNodeHttpRequest: (req: IncomingMessage, preParsedBody?: unknown) => Promise<HttpRequestType>;
export default toNodeHttpRequest;
