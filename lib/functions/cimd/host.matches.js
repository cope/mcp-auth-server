'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const hostMatches = (host, patterns) => patterns.some((pattern) => (pattern.startsWith('*.') ? host.endsWith(pattern.slice(1)) : host === pattern));
exports.default = hostMatches;
//# sourceMappingURL=host.matches.js.map