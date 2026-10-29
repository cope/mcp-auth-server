'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const jose_1 = require("jose");
const verifyIdToken = async (token, loadJwks, issuer, audience, now) => {
    const options = { issuer, audience, currentDate: now };
    try {
        return (await (0, jose_1.jwtVerify)(token, (0, jose_1.createLocalJWKSet)(await loadJwks(false)), options)).payload;
    }
    catch (error) {
        if (!(error instanceof jose_1.errors.JWKSNoMatchingKey))
            throw error;
        return (await (0, jose_1.jwtVerify)(token, (0, jose_1.createLocalJWKSet)(await loadJwks(true)), options)).payload;
    }
};
exports.default = verifyIdToken;
//# sourceMappingURL=verify.id.token.js.map