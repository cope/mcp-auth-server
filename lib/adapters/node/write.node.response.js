'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const writeNodeResponse = (res, response) => {
    const body = response.body;
    const payload = undefined === body || 'string' === typeof body ? body : JSON.stringify(body);
    res.writeHead(response.status, response.headers);
    res.end(payload);
};
exports.default = writeNodeResponse;
//# sourceMappingURL=write.node.response.js.map