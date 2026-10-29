'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const describeRedirectTarget = (redirectUri) => {
    const url = new URL(redirectUri);
    return url.protocol.startsWith('http') ? url.host : `${url.protocol}//${url.host}`;
};
exports.default = describeRedirectTarget;
//# sourceMappingURL=describe.redirect.target.js.map