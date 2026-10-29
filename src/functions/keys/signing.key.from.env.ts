'use strict';

import normalizePem from './normalize.pem';

const signingKeyFromEnv = (env: Record<string, string | undefined>, name: string): string => {
	const value: string | undefined = env[name];
	if (!value) throw new Error(`${name} is not set`);
	return normalizePem(value);
};
export default signingKeyFromEnv;
