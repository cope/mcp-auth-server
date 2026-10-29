'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const toBase64Url = (bytes) => {
    let binary = '';
    for (const byte of bytes)
        binary += String.fromCharCode(byte);
    return btoa(binary).split('=')[0].replaceAll('+', '-').replaceAll('/', '_');
};
exports.default = toBase64Url;
//# sourceMappingURL=to.base64.url.js.map