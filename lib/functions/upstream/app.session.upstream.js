'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const appSessionUpstream = (options) => ({
    async begin(context) {
        const user = await options.getSignedInUser(context.request);
        if (user)
            return { type: 'user', user };
        return { type: 'redirect', url: options.signInUrl(context.resumeUrl) };
    },
    async resume(context) {
        return (await options.getSignedInUser(context.request)) ?? null;
    },
    async verifyUser(request, userId) {
        return (await options.getSignedInUser(request))?.id === userId;
    }
});
exports.default = appSessionUpstream;
//# sourceMappingURL=app.session.upstream.js.map