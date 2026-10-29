import type HttpRequestType from '../../types/http.request.type';
declare const toHttpRequest: (request: Request) => Promise<HttpRequestType>;
export default toHttpRequest;
