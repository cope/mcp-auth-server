'use strict';

const readLimited = async (response: Response, maxBytes: number): Promise<string> => {
	const declared: number = Number(response.headers.get('content-length'));
	if (declared > maxBytes) throw new Error('client metadata document is too large');
	if (!response.body) return '';
	const reader = response.body.getReader();
	const chunks: Uint8Array[] = [];
	let total: number = 0;
	for (;;) {
		const {done, value} = await reader.read();
		if (done) break;
		total += value.byteLength;
		if (total > maxBytes) {
			await reader.cancel();
			throw new Error('client metadata document is too large');
		}
		chunks.push(value);
	}
	const bytes: Uint8Array = new Uint8Array(total);
	let offset: number = 0;
	for (const chunk of chunks) {
		bytes.set(chunk, offset);
		offset += chunk.byteLength;
	}
	return new TextDecoder().decode(bytes);
};
export default readLimited;
