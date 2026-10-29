import type HttpRequestType from './http.request.type';
import type HttpResponseType from './http.response.type';
import type RouteNameType from './route.name.type';
type RouteType = {
    method: 'GET' | 'POST';
    path: string;
    name: RouteNameType;
    handler: (request: HttpRequestType) => Promise<HttpResponseType>;
};
export default RouteType;
