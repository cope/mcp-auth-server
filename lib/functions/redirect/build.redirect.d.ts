declare const buildRedirect: (redirectUri: string, issuer: string, params: Record<string, string | undefined>) => string;
export default buildRedirect;
