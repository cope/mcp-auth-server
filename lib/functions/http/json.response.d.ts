import type HttpResponseType from '../../types/http.response.type';
declare const jsonResponse: (status: number, body: unknown, headers?: Record<string, string>) => HttpResponseType;
export default jsonResponse;
