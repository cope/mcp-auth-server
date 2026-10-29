'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const redirectResponse = (location) => ({ status: 302, headers: { location, 'cache-control': 'no-store' } });
exports.default = redirectResponse;
//# sourceMappingURL=redirect.response.js.map