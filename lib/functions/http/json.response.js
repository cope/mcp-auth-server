'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const jsonResponse = (status, body, headers = {}) => ({
    status,
    headers: { 'content-type': 'application/json', ...headers },
    body
});
exports.default = jsonResponse;
//# sourceMappingURL=json.response.js.map