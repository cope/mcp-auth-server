import type { IncomingMessage } from 'node:http';
declare const parseNodeBody: (req: IncomingMessage, preParsedBody?: unknown) => Promise<unknown>;
export default parseNodeBody;
