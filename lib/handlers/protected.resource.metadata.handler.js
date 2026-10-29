'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_response_1 = __importDefault(require("../functions/http/json.response"));
const protectedResourceMetadataHandler = async (context) => (0, json_response_1.default)(200, { resource: context.options.resource, authorization_servers: [context.issuer], bearer_methods_supported: ['header'] });
exports.default = protectedResourceMetadataHandler;
//# sourceMappingURL=protected.resource.metadata.handler.js.map