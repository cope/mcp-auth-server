'use strict';

import sha256Digest from './sha256.digest';
import toBase64Url from './to.base64.url';

const sha256Base64Url = async (value: string): Promise<string> => toBase64Url(await sha256Digest(value));
export default sha256Base64Url;
