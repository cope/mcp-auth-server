'use strict';

import type {IncomingMessage} from 'node:http';

import parseBody from '../../functions/body/parse.body';
import readNodeBody from './read.node.body';

const parseNodeBody = async (req: IncomingMessage, preParsedBody?: unknown): Promise<unknown> => {
	if (undefined !== preParsedBody) return preParsedBody;
	if ('GET' === req.method || 'HEAD' === req.method) return undefined;
	return parseBody(req.headers['content-type'], await readNodeBody(req));
};
export default parseNodeBody;
