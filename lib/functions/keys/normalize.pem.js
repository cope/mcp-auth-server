'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const pkcs1_to_pkcs8_1 = __importDefault(require("./pkcs1.to.pkcs8"));
const wrap_pem_1 = __importDefault(require("./wrap.pem"));
const normalizePem = (value) => {
    const pem = value.replace(/\\n/g, '\n').trim();
    if (!pem.includes('BEGIN RSA PRIVATE KEY'))
        return pem;
    const base64 = pem.replace(/-----[A-Z ]+-----/g, '').replace(/\s+/g, '');
    return (0, wrap_pem_1.default)((0, pkcs1_to_pkcs8_1.default)(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))));
};
exports.default = normalizePem;
//# sourceMappingURL=normalize.pem.js.map