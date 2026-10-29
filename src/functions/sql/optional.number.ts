'use strict';

const optionalNumber = (value: unknown): number | undefined => (null === value || undefined === value ? undefined : Number(value));
export default optionalNumber;
