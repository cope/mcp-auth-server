'use strict';

import {lookup} from 'node:dns/promises';

import assertPublicHost from '../../functions/cimd/assert.public.host';

const nodeSsrfGuard = async (url: URL): Promise<void> => {
	const addresses = await lookup(url.hostname.replace(/^\[|\]$/g, ''), {all: true});
	for (const {address} of addresses) {
		const host: string = address.includes(':') ? `[${address}]` : address;
		assertPublicHost(new URL(`https://${host}`));
	}
};
export default nodeSsrfGuard;
