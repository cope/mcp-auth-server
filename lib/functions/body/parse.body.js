'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const parseBody = (contentType, raw) => {
    if (!raw)
        return undefined;
    const type = (contentType ?? '').toLowerCase();
    if (type.includes('application/x-www-form-urlencoded'))
        return Object.fromEntries(new URLSearchParams(raw));
    if (type.includes('json') || !type) {
        try {
            return JSON.parse(raw);
        }
        catch {
            return undefined;
        }
    }
    return undefined;
};
exports.default = parseBody;
//# sourceMappingURL=parse.body.js.map