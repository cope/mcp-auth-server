'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_private_ipv4_1 = __importDefault(require("./is.private.ipv4"));
const is_private_ipv6_1 = __importDefault(require("./is.private.ipv6"));
const internalName = /(^|\.)(localhost|local|internal|localdomain|home\.arpa)$/;
const assertPublicHost = (url) => {
    const host = url.hostname.toLowerCase();
    if (internalName.test(host) || (0, is_private_ipv4_1.default)(host) || (0, is_private_ipv6_1.default)(host))
        throw new Error('client metadata host is not a public address');
};
exports.default = assertPublicHost;
//# sourceMappingURL=assert.public.host.js.map