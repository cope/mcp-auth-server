'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const headerValue = (headers, name) => {
    const value = headers[name] ?? headers[name.toLowerCase()];
    return Array.isArray(value) ? value[0] : value;
};
exports.default = headerValue;
//# sourceMappingURL=header.value.js.map