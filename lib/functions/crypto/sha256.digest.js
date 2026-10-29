'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const sha256Digest = async (value) => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
exports.default = sha256Digest;
//# sourceMappingURL=sha256.digest.js.map