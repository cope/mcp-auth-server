'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const jose_1 = require("jose");
const verifyAccessToken = async (keys, token, issuer, resource, now) => {
    try {
        const { payload } = await (0, jose_1.jwtVerify)(token, keys.publicKey, { algorithms: ['RS256'], issuer, audience: resource, currentDate: now });
        return { claims: payload };
    }
    catch (error) {
        if (error instanceof jose_1.errors.JWTExpired)
            return { reason: 'expired' };
        return { reason: 'invalid_token' };
    }
};
exports.default = verifyAccessToken;
//# sourceMappingURL=verify.access.token.js.map