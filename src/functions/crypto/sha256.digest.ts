'use strict';

const sha256Digest = async (value: string): Promise<Uint8Array> => new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)));
export default sha256Digest;
