'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const trimTrailingSlashes = (value) => {
    let end = value.length;
    while (end > 0 && '/' === value[end - 1])
        end -= 1;
    return value.slice(0, end);
};
exports.default = trimTrailingSlashes;
//# sourceMappingURL=trim.trailing.slashes.js.map