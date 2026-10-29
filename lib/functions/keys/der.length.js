'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const derLength = (length) => {
    if (length < 128)
        return [length];
    const bytes = [];
    for (let rest = length; rest > 0; rest = Math.floor(rest / 256))
        bytes.unshift(rest % 256);
    return [128 + bytes.length, ...bytes];
};
exports.default = derLength;
//# sourceMappingURL=der.length.js.map