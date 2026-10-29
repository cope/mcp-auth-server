'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fromD1 = (db) => async (sql, params) => (await db
    .prepare(sql)
    .bind(...params)
    .all()).results ?? [];
exports.default = fromD1;
//# sourceMappingURL=from.d1.js.map