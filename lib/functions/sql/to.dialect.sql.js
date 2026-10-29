'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const toDialectSql = (sql, dialect) => {
    if ('postgres' !== dialect)
        return sql;
    let index = 0;
    return sql.replaceAll('?', () => {
        index += 1;
        return `$${index}`;
    });
};
exports.default = toDialectSql;
//# sourceMappingURL=to.dialect.sql.js.map