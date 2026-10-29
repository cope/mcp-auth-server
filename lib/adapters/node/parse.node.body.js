'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const parse_body_1 = __importDefault(require("../../functions/body/parse.body"));
const read_node_body_1 = __importDefault(require("./read.node.body"));
const parseNodeBody = async (req, preParsedBody) => {
    if (undefined !== preParsedBody)
        return preParsedBody;
    if ('GET' === req.method || 'HEAD' === req.method)
        return undefined;
    return (0, parse_body_1.default)(req.headers['content-type'], await (0, read_node_body_1.default)(req));
};
exports.default = parseNodeBody;
//# sourceMappingURL=parse.node.body.js.map