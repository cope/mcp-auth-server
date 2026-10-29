declare const readLimited: (response: Response, maxBytes: number) => Promise<string>;
export default readLimited;
