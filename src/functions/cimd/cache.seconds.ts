'use strict';

const cacheSeconds = (header: string | null, maxCacheSeconds: number, defaultCacheSeconds: number): number => {
	if (!header) return defaultCacheSeconds;
	const directives: string[] = header
		.toLowerCase()
		.split(',')
		.map((part: string): string => part.trim());
	if (directives.some((directive: string): boolean => 'no-store' === directive || 'no-cache' === directive)) return 0;
	const maxAge: RegExpExecArray | undefined = directives.map((directive: string): RegExpExecArray | null => /^max-age=(\d+)$/.exec(directive)).find(Boolean) as
		RegExpExecArray | undefined;
	return maxAge ? Math.min(Number(maxAge[1]), maxCacheSeconds) : defaultCacheSeconds;
};
export default cacheSeconds;
