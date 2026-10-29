'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const readNodeBody = async (req) => {
    const chunks = [];
    for await (const chunk of req)
        chunks.push(Buffer.from(chunk));
    return Buffer.concat(chunks).toString('utf8');
};
exports.default = readNodeBody;
//# sourceMappingURL=read.node.body.js.map