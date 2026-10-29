'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const findRoute = (routes, request) => routes.find((route) => route.method === request.method.toUpperCase() && route.path === request.path);
exports.default = findRoute;
//# sourceMappingURL=find.route.js.map