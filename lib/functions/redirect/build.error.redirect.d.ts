declare const buildErrorRedirect: (redirectUri: string, issuer: string, error: string, description: string, state?: string) => string;
export default buildErrorRedirect;
