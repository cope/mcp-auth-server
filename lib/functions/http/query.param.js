'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const queryParam = (request, name) => {
    const value = request.query[name];
    return 'string' === typeof value ? value : undefined;
};
exports.default = queryParam;
//# sourceMappingURL=query.param.js.map