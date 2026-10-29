'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("node:dns/promises");
const assert_public_host_1 = __importDefault(require("../../functions/cimd/assert.public.host"));
const nodeSsrfGuard = async (url) => {
    const addresses = await (0, promises_1.lookup)(url.hostname.replace(/^\[|\]$/g, ''), { all: true });
    for (const { address } of addresses) {
        const host = address.includes(':') ? `[${address}]` : address;
        (0, assert_public_host_1.default)(new URL(`https://${host}`));
    }
};
exports.default = nodeSsrfGuard;
//# sourceMappingURL=node.ssrf.guard.js.map