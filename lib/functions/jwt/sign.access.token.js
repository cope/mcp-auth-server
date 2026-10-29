'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jose_1 = require("jose");
const random_id_1 = __importDefault(require("../crypto/random.id"));
const signAccessToken = async (keys, input) => {
    const issuedAt = Math.floor(input.now.getTime() / 1000);
    return new jose_1.SignJWT({ client_id: input.clientId })
        .setProtectedHeader({ alg: 'RS256' })
        .setIssuer(input.issuer)
        .setAudience(input.resource)
        .setSubject(input.userId)
        .setJti((0, random_id_1.default)())
        .setIssuedAt(issuedAt)
        .setExpirationTime(issuedAt + input.ttlSeconds)
        .sign(keys.privateKey);
};
exports.default = signAccessToken;
//# sourceMappingURL=sign.access.token.js.map