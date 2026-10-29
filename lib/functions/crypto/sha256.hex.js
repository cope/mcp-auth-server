'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const sha256_digest_1 = __importDefault(require("./sha256.digest"));
const sha256Hex = async (value) => Array.from(await (0, sha256_digest_1.default)(value), (byte) => byte.toString(16).padStart(2, '0')).join('');
exports.default = sha256Hex;
//# sourceMappingURL=sha256.hex.js.map