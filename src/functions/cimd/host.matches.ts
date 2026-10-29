'use strict';

const hostMatches = (host: string, patterns: string[]): boolean =>
	patterns.some((pattern: string): boolean => (pattern.startsWith('*.') ? host.endsWith(pattern.slice(1)) : host === pattern));
export default hostMatches;
