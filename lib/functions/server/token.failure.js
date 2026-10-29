'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const oauth_error_response_1 = __importDefault(require("../http/oauth.error.response"));
const tokenFailure = (error, description, status = 400) => (0, oauth_error_response_1.default)(status, error, description, { 'cache-control': 'no-store', pragma: 'no-cache' });
exports.default = tokenFailure;
//# sourceMappingURL=token.failure.js.map