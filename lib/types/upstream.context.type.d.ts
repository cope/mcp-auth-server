import type HttpRequestType from './http.request.type';
import type PendingAuthorizationType from './pending.authorization.type';
type UpstreamContextType = {
    request: HttpRequestType;
    pending: PendingAuthorizationType;
    issuer: string;
    callbackUrl: string;
    resumeUrl: string;
};
export default UpstreamContextType;
