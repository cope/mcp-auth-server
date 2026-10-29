'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fromNodeSqlite = (db) => (sql, params) => db.prepare(sql).all(...params);
exports.default = fromNodeSqlite;
//# sourceMappingURL=from.node.sqlite.js.map