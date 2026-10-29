'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const readLimited = async (response, maxBytes) => {
    const declared = Number(response.headers.get('content-length'));
    if (declared > maxBytes)
        throw new Error('client metadata document is too large');
    if (!response.body)
        return '';
    const reader = response.body.getReader();
    const chunks = [];
    let total = 0;
    for (;;) {
        const { done, value } = await reader.read();
        if (done)
            break;
        total += value.byteLength;
        if (total > maxBytes) {
            await reader.cancel();
            throw new Error('client metadata document is too large');
        }
        chunks.push(value);
    }
    const bytes = new Uint8Array(total);
    let offset = 0;
    for (const chunk of chunks) {
        bytes.set(chunk, offset);
        offset += chunk.byteLength;
    }
    return new TextDecoder().decode(bytes);
};
exports.default = readLimited;
//# sourceMappingURL=read.limited.js.map