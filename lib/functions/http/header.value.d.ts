import type HttpRequestType from '../../types/http.request.type';
declare const headerValue: (headers: HttpRequestType["headers"], name: string) => string | undefined;
export default headerValue;
