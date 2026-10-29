'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const wrapPem = (der) => {
    let binary = '';
    for (const byte of der)
        binary += String.fromCharCode(byte);
    const lines = btoa(binary).match(/.{1,64}/g) ?? [];
    return `-----BEGIN PRIVATE KEY-----\n${lines.join('\n')}\n-----END PRIVATE KEY-----`;
};
exports.default = wrapPem;
//# sourceMappingURL=wrap.pem.js.map