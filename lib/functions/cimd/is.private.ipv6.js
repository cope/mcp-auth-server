'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const is_private_ipv4_1 = __importDefault(require("./is.private.ipv4"));
const isPrivateIpv6 = (host) => {
    const address = host.replace(/^\[|\]$/g, '').toLowerCase();
    if (!address.includes(':'))
        return false;
    const mapped = /^::ffff:(\d+\.\d+\.\d+\.\d+)$/.exec(address);
    if (mapped)
        return (0, is_private_ipv4_1.default)(mapped[1]);
    return '::' === address || '::1' === address || /^f[cd]/.test(address) || /^fe[89ab]/.test(address) || address.startsWith('::ffff:');
};
exports.default = isPrivateIpv6;
//# sourceMappingURL=is.private.ipv6.js.map