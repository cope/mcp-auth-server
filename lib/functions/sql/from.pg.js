'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fromPg = (client) => async (sql, params) => (await client.query(sql, params)).rows;
exports.default = fromPg;
//# sourceMappingURL=from.pg.js.map