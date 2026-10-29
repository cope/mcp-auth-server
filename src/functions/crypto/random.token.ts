'use strict';

import toBase64Url from './to.base64.url';

const randomToken = (byteLength: number = 32): string => toBase64Url(crypto.getRandomValues(new Uint8Array(byteLength)));
export default randomToken;
