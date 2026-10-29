'use strict';

const textValue = (value: unknown): string | undefined => ('string' === typeof value && value ? value : undefined);
export default textValue;
