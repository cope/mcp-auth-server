'use strict';

const formParams = (body: unknown): Record<string, unknown> => (body && 'object' === typeof body ? (body as Record<string, unknown>) : {});
export default formParams;
