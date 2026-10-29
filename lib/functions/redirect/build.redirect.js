'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const buildRedirect = (redirectUri, issuer, params) => {
    const target = new URL(redirectUri);
    for (const [key, value] of Object.entries(params))
        if (value)
            target.searchParams.set(key, value);
    target.searchParams.set('iss', issuer);
    return target.toString();
};
exports.default = buildRedirect;
//# sourceMappingURL=build.redirect.js.map