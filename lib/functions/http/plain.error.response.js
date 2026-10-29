'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const plainErrorResponse = (status, message) => ({ status, headers: { 'content-type': 'text/plain', 'cache-control': 'no-store' }, body: message });
exports.default = plainErrorResponse;
//# sourceMappingURL=plain.error.response.js.map