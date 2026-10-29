import type AuthenticatedUserType from './authenticated.user.type';
import type CimdOptionsType from './cimd.options.type';
import type ConsentModelType from './consent.model.type';
import type IStorage from './i.storage';
import type IUpstream from './i.upstream';
import type LoggerType from './logger.type';
import type RouteNameType from './route.name.type';
type McpAuthOptionsType<TUser = unknown> = {
    issuer: string;
    resource: string;
    signingKey: CryptoKey | string;
    verificationKey?: CryptoKey;
    storage: IStorage;
    upstream: IUpstream;
    resolveUser?: (claims: Record<string, unknown>) => Promise<AuthenticatedUserType> | AuthenticatedUserType;
    loadActiveUser: (id: string) => Promise<TUser | null> | TUser | null;
    renderConsent?: (model: ConsentModelType) => string;
    rateLimit?: (key: string, route: RouteNameType) => Promise<boolean> | boolean;
    logger?: LoggerType;
    callbackPath?: string;
    productName?: string;
    environmentLabel?: string;
    registration?: {
        enabled?: boolean;
    };
    cimd?: CimdOptionsType;
    redirects?: {
        httpsHosts?: string[];
        customSchemes?: string[];
    };
    ttl?: {
        accessToken?: number;
        refreshToken?: number;
        pending?: number;
        code?: number;
    };
    now?: () => Date;
};
export default McpAuthOptionsType;
