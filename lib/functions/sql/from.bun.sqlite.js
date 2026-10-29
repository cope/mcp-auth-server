'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fromBunSqlite = (db) => (sql, params) => db.query(sql).all(...params);
exports.default = fromBunSqlite;
//# sourceMappingURL=from.bun.sqlite.js.map