'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const header_value_1 = __importDefault(require("../http/header.value"));
const hasCredentials = (request, params) => undefined !== params.client_secret || !!(0, header_value_1.default)(request.headers, 'authorization');
exports.default = hasCredentials;
//# sourceMappingURL=has.credentials.js.map