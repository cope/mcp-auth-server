'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlStorage = exports.fromPostgresJs = exports.fromPg = exports.postgresSchema = exports.postgresStorage = void 0;
const from_pg_1 = __importDefault(require("./functions/sql/from.pg"));
exports.fromPg = from_pg_1.default;
const from_postgres_js_1 = __importDefault(require("./functions/sql/from.postgres.js"));
exports.fromPostgresJs = from_postgres_js_1.default;
const sql_schema_1 = __importDefault(require("./functions/sql/sql.schema"));
const sql_storage_1 = __importDefault(require("./storage/sql.storage"));
exports.SqlStorage = sql_storage_1.default;
const postgresStorage = (executor, options) => new sql_storage_1.default(executor, 'postgres', options);
exports.postgresStorage = postgresStorage;
const postgresSchema = (tablePrefix) => (0, sql_schema_1.default)('postgres', tablePrefix);
exports.postgresSchema = postgresSchema;
const McpAuthPostgres = {};
exports.default = McpAuthPostgres;
//# sourceMappingURL=mcp.auth.postgres.js.map