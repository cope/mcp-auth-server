'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fromPostgresJs = (client) => async (sql, params) => Array.from(await client.unsafe(sql, params));
exports.default = fromPostgresJs;
//# sourceMappingURL=from.postgres.js.js.map