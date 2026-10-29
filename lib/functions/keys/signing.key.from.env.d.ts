declare const signingKeyFromEnv: (env: Record<string, string | undefined>, name: string) => string;
export default signingKeyFromEnv;
