import type HttpResponseType from '../../types/http.response.type';
declare const oauthErrorResponse: (status: number, error: string, description: string, headers?: Record<string, string>) => HttpResponseType;
export default oauthErrorResponse;
