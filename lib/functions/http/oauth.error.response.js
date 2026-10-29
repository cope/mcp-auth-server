'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const json_response_1 = __importDefault(require("./json.response"));
const oauthErrorResponse = (status, error, description, headers = {}) => (0, json_response_1.default)(status, { error, error_description: description }, headers);
exports.default = oauthErrorResponse;
//# sourceMappingURL=oauth.error.response.js.map