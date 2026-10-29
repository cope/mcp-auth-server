'use strict';

import type ConsentModelType from '../../types/consent.model.type';
import consentStyles from './consent.styles';
import escapeHtml from './escape.html';

const renderDefaultConsent = (model: ConsentModelType): string => {
	const name: string = escapeHtml(model.clientName || 'An MCP client');
	const product: string = escapeHtml(model.environmentLabel ? `${model.productName} (${model.environmentLabel})` : model.productName);
	const target: string = escapeHtml(model.redirectTarget);
	const host: string = model.clientHost ? `<span class="host">${escapeHtml(model.clientHost)}</span>` : '';
	const identity: string = model.metadataDocument
		? `<p class="muted">The name <strong>${name}</strong> is declared by the client itself and is not verified. It is identified by <strong>${escapeHtml(model.clientHost ?? model.clientId)}</strong>.</p>`
		: '';
	const localhost: string = model.redirectIsLocalhost
		? '<p class="warn">This client receives the result on your own computer (localhost). Any program on this machine could claim to be this client.</p>'
		: '';
	const signedInAs: string = model.userDisplayName ? `<p class="user">Signing in as <strong>${escapeHtml(model.userDisplayName)}</strong></p>` : '';
	const env: string = model.environmentLabel ? `<span class="env">${escapeHtml(model.environmentLabel)}</span>` : '';

	return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Authorize ${name} - ${product}</title>
<style>${consentStyles}</style>
</head>
<body>
<header><span>${escapeHtml(model.productName)}</span>${env}</header>
<main>
<h1>${name} ${host}<br>wants to connect to ${product}</h1>
${signedInAs}
${identity}
${localhost}
<p class="muted">After you decide, you are sent back to <strong>${target}</strong>. Only approve clients you started yourself.</p>
<form method="post" action="${escapeHtml(model.action)}">
<input type="hidden" name="state" value="${escapeHtml(model.state)}">
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
export default renderDefaultConsent;
