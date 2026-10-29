import type KeyPairType from './key.pair.type';
import type McpAuthOptionsType from './mcp.auth.options.type';
import type RedirectPolicyType from './redirect.policy.type';
import type ConsentModelType from './consent.model.type';
import type ResolvedClientType from './resolved.client.type';
type McpAuthContextType<TUser = unknown> = {
    options: McpAuthOptionsType<TUser>;
    issuer: string;
    basePath: string;
    callbackPath: string;
    productName: string;
    redirectPolicy: RedirectPolicyType;
    ttl: {
        accessToken: number;
        refreshToken: number;
        pending: number;
        code: number;
    };
    now: () => Date;
    registrationEnabled: boolean;
    cimdEnabled: boolean;
    renderConsent: (model: ConsentModelType) => string;
    resourceMetadataUrl: string;
    getKeys: () => Promise<KeyPairType>;
    resolveClient: (clientId: string) => Promise<ResolvedClientType | {
        error: string;
    }>;
};
export default McpAuthContextType;
