'use strict';

import sha256Digest from './sha256.digest';

const sha256Hex = async (value: string): Promise<string> => Array.from(await sha256Digest(value), (byte: number): string => byte.toString(16).padStart(2, '0')).join('');
export default sha256Hex;
