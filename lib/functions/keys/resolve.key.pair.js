'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jose_1 = require("jose");
const is_rsa_key_1 = __importDefault(require("./is.rsa.key"));
const normalize_pem_1 = __importDefault(require("./normalize.pem"));
const resolveKeyPair = async (signingKey, verificationKey) => {
    let privateKey;
    try {
        privateKey = 'string' === typeof signingKey ? (await (0, jose_1.importPKCS8)((0, normalize_pem_1.default)(signingKey), 'RS256', { extractable: true })) : signingKey;
    }
    catch {
        throw new Error('signingKey is not a valid RSA private key in PEM (PKCS8 or PKCS1) form');
    }
    if (!(0, is_rsa_key_1.default)(privateKey))
        throw new Error('signingKey must be an RSA key usable with RS256');
    if (verificationKey)
        return { privateKey, publicKey: verificationKey };
    if (false === privateKey.extractable)
        throw new Error('signingKey is not extractable: pass verificationKey with the matching public key');
    const { kty, n, e } = await (0, jose_1.exportJWK)(privateKey);
    return { privateKey, publicKey: (await (0, jose_1.importJWK)({ kty, n, e }, 'RS256')) };
};
exports.default = resolveKeyPair;
//# sourceMappingURL=resolve.key.pair.js.map