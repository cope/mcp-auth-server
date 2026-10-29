'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const normalize_pem_1 = __importDefault(require("./normalize.pem"));
const signingKeyFromEnv = (env, name) => {
    const value = env[name];
    if (!value)
        throw new Error(`${name} is not set`);
    return (0, normalize_pem_1.default)(value);
};
exports.default = signingKeyFromEnv;
//# sourceMappingURL=signing.key.from.env.js.map