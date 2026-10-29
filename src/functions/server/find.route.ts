'use strict';

import type HttpRequestType from '../../types/http.request.type';
import type RouteType from '../../types/route.type';

const findRoute = (routes: RouteType[], request: HttpRequestType): RouteType | undefined =>
	routes.find((route: RouteType): boolean => route.method === request.method.toUpperCase() && route.path === request.path);
export default findRoute;
