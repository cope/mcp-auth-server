import type AuthenticatedUserType from './authenticated.user.type';
import type HttpRequestType from './http.request.type';
import type UpstreamBeginType from './upstream.begin.type';
import type UpstreamContextType from './upstream.context.type';
interface IUpstream {
    begin(context: UpstreamContextType): Promise<UpstreamBeginType>;
    callback?(context: UpstreamContextType): Promise<Record<string, unknown> | null>;
    resume?(context: UpstreamContextType): Promise<AuthenticatedUserType | null>;
    verifyUser?(request: HttpRequestType, userId: string): Promise<boolean>;
}
export default IUpstream;
