'use strict';

const escapeHtml = (value: string): string =>
	value.replace(/[&<>"']/g, (char: string): string => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'})[char] as string);
export default escapeHtml;
