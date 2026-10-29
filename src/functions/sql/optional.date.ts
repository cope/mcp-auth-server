'use strict';

const optionalDate = (value: Date | undefined): number | null => (value ? value.getTime() : null);
export default optionalDate;
