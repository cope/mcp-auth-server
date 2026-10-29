'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const query_param_1 = __importDefault(require("../http/query.param"));
const loadPending = async (context, request) => {
    const state = (0, query_param_1.default)(request, 'state');
    const pending = state ? await context.options.storage.getPendingAuthorization(state, context.now()) : null;
    return pending && !pending.userId ? pending : null;
};
exports.default = loadPending;
//# sourceMappingURL=load.pending.js.map