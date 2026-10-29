'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_url_1 = __importDefault(require("./parse.url"));
const loopbackHosts = ['localhost', '127.0.0.1'];
const isLoopbackRedirect = (redirectUri) => {
    const url = (0, parse_url_1.default)(redirectUri);
    return !!url && 'http:' === url.protocol && loopbackHosts.includes(url.hostname);
};
exports.default = isLoopbackRedirect;
//# sourceMappingURL=is.loopback.redirect.js.map