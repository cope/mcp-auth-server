'use strict';

const isMetadataClientId = (clientId: string): boolean => {
	let url: URL;
	try {
		url = new URL(clientId);
	} catch {
		return false;
	}
	return 'https:' === url.protocol && '/' !== url.pathname && !url.hash && !url.username && !url.password && url.href === clientId;
};
export default isMetadataClientId;
