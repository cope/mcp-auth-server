'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const challengeResponse = (context, rpcBody, tokenSent, reason) => {
    const metadata = `resource_metadata="${context.resourceMetadataUrl}"`;
    const id = rpcBody && 'object' === typeof rpcBody && !Array.isArray(rpcBody) ? (rpcBody.id ?? null) : null;
    return {
        status: 401,
        reason,
        headers: { 'www-authenticate': tokenSent ? `Bearer error="invalid_token", ${metadata}` : `Bearer ${metadata}`, 'content-type': 'application/json' },
        body: { jsonrpc: '2.0', id, error: { code: -32000, message: 'Authentication Required' } }
    };
};
exports.default = challengeResponse;
//# sourceMappingURL=challenge.response.js.map