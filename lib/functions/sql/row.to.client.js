'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const optional_text_1 = __importDefault(require("./optional.text"));
const rowToClient = (row) => ({
    clientId: String(row.client_id),
    clientName: (0, optional_text_1.default)(row.client_name),
    redirectUris: JSON.parse(String(row.redirect_uris)),
    applicationType: (0, optional_text_1.default)(row.application_type),
    tokenEndpointAuthMethod: 'none',
    grantTypes: JSON.parse(String(row.grant_types)),
    responseTypes: JSON.parse(String(row.response_types)),
    createdAt: new Date(Number(row.created_at))
});
exports.default = rowToClient;
//# sourceMappingURL=row.to.client.js.map