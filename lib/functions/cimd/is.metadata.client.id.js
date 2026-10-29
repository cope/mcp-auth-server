'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const isMetadataClientId = (clientId) => {
    let url;
    try {
        url = new URL(clientId);
    }
    catch {
        return false;
    }
    return 'https:' === url.protocol && '/' !== url.pathname && !url.hash && !url.username && !url.password && url.href === clientId;
};
exports.default = isMetadataClientId;
//# sourceMappingURL=is.metadata.client.id.js.map