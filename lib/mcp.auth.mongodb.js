'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MongoStorage = void 0;
const mongodb_storage_1 = __importDefault(require("./storage/mongodb.storage"));
exports.MongoStorage = mongodb_storage_1.default;
const McpAuthMongodb = {};
exports.default = McpAuthMongodb;
//# sourceMappingURL=mcp.auth.mongodb.js.map