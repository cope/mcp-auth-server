'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const consent_styles_1 = __importDefault(require("./consent.styles"));
const escape_html_1 = __importDefault(require("./escape.html"));
const renderDefaultConsent = (model) => {
    const name = (0, escape_html_1.default)(model.clientName || 'An MCP client');
    const product = (0, escape_html_1.default)(model.environmentLabel ? `${model.productName} (${model.environmentLabel})` : model.productName);
    const target = (0, escape_html_1.default)(model.redirectTarget);
    const host = model.clientHost ? `<span class="host">${(0, escape_html_1.default)(model.clientHost)}</span>` : '';
    const identity = model.metadataDocument
        ? `<p class="muted">The name <strong>${name}</strong> is declared by the client itself and is not verified. It is identified by <strong>${(0, escape_html_1.default)(model.clientHost ?? model.clientId)}</strong>.</p>`
        : '';
    const localhost = model.redirectIsLocalhost
        ? '<p class="warn">This client receives the result on your own computer (localhost). Any program on this machine could claim to be this client.</p>'
        : '';
    const signedInAs = model.userDisplayName ? `<p class="user">Signing in as <strong>${(0, escape_html_1.default)(model.userDisplayName)}</strong></p>` : '';
    const env = model.environmentLabel ? `<span class="env">${(0, escape_html_1.default)(model.environmentLabel)}</span>` : '';
    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Authorize ${name} - ${product}</title>
<style>${consent_styles_1.default}</style>
</head>
<body>
<header><span>${(0, escape_html_1.default)(model.productName)}</span>${env}</header>
<main>
<h1>${name} ${host}<br>wants to connect to ${product}</h1>
${signedInAs}
${identity}
${localhost}
<p class="muted">After you decide, you are sent back to <strong>${target}</strong>. Only approve clients you started yourself.</p>
<form method="post" action="${(0, escape_html_1.default)(model.action)}">
<input type="hidden" name="state" value="${(0, escape_html_1.default)(model.state)}">
<div class="actions">
<button class="approve" type="submit" name="decision" value="approve">Approve</button>
<button type="submit" name="decision" value="deny">Deny</button>
</div>
</form>
</main>
</body>
</html>
`;
};
exports.default = renderDefaultConsent;
//# sourceMappingURL=render.default.consent.js.map