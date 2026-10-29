'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const to_base64_url_1 = __importDefault(require("./to.base64.url"));
const randomToken = (byteLength = 32) => (0, to_base64_url_1.default)(crypto.getRandomValues(new Uint8Array(byteLength)));
exports.default = randomToken;
//# sourceMappingURL=random.token.js.map