'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const isPrivateIpv4 = (host) => {
    const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
    if (!match)
        return false;
    const [a, b] = [Number(match[1]), Number(match[2])];
    return (0 === a ||
        10 === a ||
        127 === a ||
        (169 === a && 254 === b) ||
        (172 === a && b >= 16 && b <= 31) ||
        (192 === a && 168 === b) ||
        (100 === a && b >= 64 && b <= 127) ||
        a >= 224);
};
exports.default = isPrivateIpv4;
//# sourceMappingURL=is.private.ipv4.js.map