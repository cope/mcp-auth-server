import type HttpRequestType from '../../types/http.request.type';
import type RouteType from '../../types/route.type';
declare const findRoute: (routes: RouteType[], request: HttpRequestType) => RouteType | undefined;
export default findRoute;
