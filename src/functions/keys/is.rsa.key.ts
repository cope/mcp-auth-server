'use strict';

const isRsaKey = (key: unknown): boolean => {
	const candidate = key as {asymmetricKeyType?: string; algorithm?: {name?: string}};
	return 'rsa' === candidate.asymmetricKeyType || 'RSASSA-PKCS1-v1_5' === candidate.algorithm?.name;
};
export default isRsaKey;
