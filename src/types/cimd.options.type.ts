'use strict';

import type IMetadataCache from './i.metadata.cache';

type CimdOptionsType = {
	enabled?: boolean;
	fetch?: typeof fetch;
	guard?: (url: URL) => Promise<void> | void;
	cache?: IMetadataCache;
	timeoutMs?: number;
	maxBytes?: number;
	maxCacheSeconds?: number;
	defaultCacheSeconds?: number;
	trust?: {allowHosts?: string[]; denyHosts?: string[]};
};
export default CimdOptionsType;
