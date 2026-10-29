import type { IncomingMessage } from 'node:http';
declare const readNodeBody: (req: IncomingMessage) => Promise<string>;
export default readNodeBody;
