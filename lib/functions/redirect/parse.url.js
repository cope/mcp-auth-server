'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const parseUrl = (value) => {
    if ('string' !== typeof value)
        return null;
    try {
        return new URL(value);
    }
    catch {
        return null;
    }
};
exports.default = parseUrl;
//# sourceMappingURL=parse.url.js.map