'use strict';

const optionalText = (value: unknown): string | undefined => (null === value || undefined === value ? undefined : String(value));
export default optionalText;
