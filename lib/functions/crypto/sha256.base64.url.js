'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sha256_digest_1 = __importDefault(require("./sha256.digest"));
const to_base64_url_1 = __importDefault(require("./to.base64.url"));
const sha256Base64Url = async (value) => (0, to_base64_url_1.default)(await (0, sha256_digest_1.default)(value));
exports.default = sha256Base64Url;
//# sourceMappingURL=sha256.base64.url.js.map