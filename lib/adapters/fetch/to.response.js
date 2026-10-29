'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const toResponse = (response) => {
    const body = response.body;
    if (undefined === body)
        return new Response(null, { status: response.status, headers: response.headers });
    return new Response('string' === typeof body ? body : JSON.stringify(body), { status: response.status, headers: response.headers });
};
exports.default = toResponse;
//# sourceMappingURL=to.response.js.map