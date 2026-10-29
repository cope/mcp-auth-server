'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlStorage = exports.fromD1 = exports.fromBunSqlite = exports.fromNodeSqlite = exports.fromBetterSqlite3 = exports.sqliteSchema = exports.sqliteStorage = void 0;
const from_better_sqlite3_1 = __importDefault(require("./functions/sql/from.better.sqlite3"));
exports.fromBetterSqlite3 = from_better_sqlite3_1.default;
const from_bun_sqlite_1 = __importDefault(require("./functions/sql/from.bun.sqlite"));
exports.fromBunSqlite = from_bun_sqlite_1.default;
const from_d1_1 = __importDefault(require("./functions/sql/from.d1"));
exports.fromD1 = from_d1_1.default;
const from_node_sqlite_1 = __importDefault(require("./functions/sql/from.node.sqlite"));
exports.fromNodeSqlite = from_node_sqlite_1.default;
const sql_schema_1 = __importDefault(require("./functions/sql/sql.schema"));
const sql_storage_1 = __importDefault(require("./storage/sql.storage"));
exports.SqlStorage = sql_storage_1.default;
const sqliteStorage = (executor, options) => new sql_storage_1.default(executor, 'sqlite', options);
exports.sqliteStorage = sqliteStorage;
const sqliteSchema = (tablePrefix) => (0, sql_schema_1.default)('sqlite', tablePrefix);
exports.sqliteSchema = sqliteSchema;
const McpAuthSqlite = {};
exports.default = McpAuthSqlite;
//# sourceMappingURL=mcp.auth.sqlite.js.map