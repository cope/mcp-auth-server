#!/usr/bin/env node
import {generateKeyPairSync} from 'node:crypto';
import {writeFileSync} from 'node:fs';

const args = process.argv.slice(2);
const option = (name, fallback) => {
	const index = args.indexOf(name);
	return -1 === index ? fallback : args[index + 1];
};

if (args.includes('--help')) {
	console.log('usage: mcp-auth-keygen [--bits 2048] [--env NAME] [--out file.pem]');
	process.exit(0);
}

const {privateKey} = generateKeyPairSync('rsa', {modulusLength: Number(option('--bits', '2048'))});
const pem = privateKey.export({type: 'pkcs8', format: 'pem'}).trim();
const outFile = option('--out');

if (outFile) {
	writeFileSync(outFile, `${pem}\n`, {mode: 0o600});
	console.log(`private key written to ${outFile}`);
} else {
	const envName = option('--env', 'MCP_OAUTH_SIGNING_KEY');
	console.log(`${envName}=${pem.split('\n').join('\\n')}`);
}
