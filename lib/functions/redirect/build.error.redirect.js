'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const build_redirect_1 = __importDefault(require("./build.redirect"));
const buildErrorRedirect = (redirectUri, issuer, error, description, state) => (0, build_redirect_1.default)(redirectUri, issuer, { error, error_description: description, state });
exports.default = buildErrorRedirect;
//# sourceMappingURL=build.error.redirect.js.map