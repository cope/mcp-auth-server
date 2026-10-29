'use strict';

import type {IncomingMessage} from 'node:http';

const readNodeBody = async (req: IncomingMessage): Promise<string> => {
	const chunks: Buffer[] = [];
	for await (const chunk of req) chunks.push(Buffer.from(chunk));
	return Buffer.concat(chunks).toString('utf8');
};
export default readNodeBody;
