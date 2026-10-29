import type HttpResponseType from '../../types/http.response.type';
declare const tokenFailure: (error: string, description: string, status?: number) => HttpResponseType;
export default tokenFailure;
