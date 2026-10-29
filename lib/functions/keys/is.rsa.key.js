'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const isRsaKey = (key) => {
    const candidate = key;
    return 'rsa' === candidate.asymmetricKeyType || 'RSASSA-PKCS1-v1_5' === candidate.algorithm?.name;
};
exports.default = isRsaKey;
//# sourceMappingURL=is.rsa.key.js.map