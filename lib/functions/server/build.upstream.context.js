'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const buildUpstreamContext = (context, request, pending) => ({
    request,
    pending,
    issuer: context.issuer,
    callbackUrl: `${context.issuer}${context.callbackPath}`,
    resumeUrl: `${context.issuer}/oauth/resume?state=${encodeURIComponent(pending.stateId)}`
});
exports.default = buildUpstreamContext;
//# sourceMappingURL=build.upstream.context.js.map