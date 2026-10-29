'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const escapeHtml = (value) => value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
exports.default = escapeHtml;
//# sourceMappingURL=escape.html.js.map