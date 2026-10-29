'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fromBetterSqlite3 = (db) => (sql, params) => {
    const statement = db.prepare(sql);
    if (statement.reader)
        return statement.all(...params);
    statement.run(...params);
    return [];
};
exports.default = fromBetterSqlite3;
//# sourceMappingURL=from.better.sqlite3.js.map