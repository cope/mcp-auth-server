import type AuthenticatedUserType from './authenticated.user.type';
import type HttpRequestType from './http.request.type';
type AppSessionUpstreamOptionsType = {
    getSignedInUser: (request: HttpRequestType) => Promise<AuthenticatedUserType | null> | AuthenticatedUserType | null;
    signInUrl: (returnTo: string) => string;
};
export default AppSessionUpstreamOptionsType;
