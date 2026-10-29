'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const parseQuery = (search) => {
    const params = 'string' === typeof search ? new URLSearchParams(search) : search;
    const query = {};
    for (const [key, value] of params) {
        const existing = query[key];
        if (undefined === existing)
            query[key] = value;
        else
            query[key] = [].concat(existing, value);
    }
    return query;
};
exports.default = parseQuery;
//# sourceMappingURL=parse.query.js.map