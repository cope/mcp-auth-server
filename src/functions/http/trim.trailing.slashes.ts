'use strict';

const trimTrailingSlashes = (value: string): string => {
	let end: number = value.length;
	while (end > 0 && '/' === value[end - 1]) end -= 1;
	return value.slice(0, end);
};
export default trimTrailingSlashes;
