'use strict';

const derLength = (length: number): number[] => {
	if (length < 128) return [length];
	const bytes: number[] = [];
	for (let rest = length; rest > 0; rest = Math.floor(rest / 256)) bytes.unshift(rest % 256);
	return [128 + bytes.length, ...bytes];
};
export default derLength;
