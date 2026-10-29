'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const der_length_1 = __importDefault(require("./der.length"));
const rsaEncryptionAlgorithm = [0x30, 0x0d, 0x06, 0x09, 0x2a, 0x86, 0x48, 0x86, 0xf7, 0x0d, 0x01, 0x01, 0x01, 0x05, 0x00];
const pkcs1ToPkcs8 = (pkcs1) => {
    const octetString = [0x04, ...(0, der_length_1.default)(pkcs1.length), ...pkcs1];
    const body = [0x02, 0x01, 0x00, ...rsaEncryptionAlgorithm, ...octetString];
    return Uint8Array.from([0x30, ...(0, der_length_1.default)(body.length), ...body]);
};
exports.default = pkcs1ToPkcs8;
//# sourceMappingURL=pkcs1.to.pkcs8.js.map