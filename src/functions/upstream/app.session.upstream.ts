'use strict';

import type AppSessionUpstreamOptionsType from '../../types/app.session.upstream.options.type';
import type AuthenticatedUserType from '../../types/authenticated.user.type';
import type HttpRequestType from '../../types/http.request.type';
import type IUpstream from '../../types/i.upstream';
import type UpstreamBeginType from '../../types/upstream.begin.type';
import type UpstreamContextType from '../../types/upstream.context.type';

const appSessionUpstream = (options: AppSessionUpstreamOptionsType): IUpstream => ({
	async begin(context: UpstreamContextType): Promise<UpstreamBeginType> {
		const user: AuthenticatedUserType | null = await options.getSignedInUser(context.request);
		if (user) return {type: 'user', user};
		return {type: 'redirect', url: options.signInUrl(context.resumeUrl)};
	},

	async resume(context: UpstreamContextType): Promise<AuthenticatedUserType | null> {
		return (await options.getSignedInUser(context.request)) ?? null;
	},

	async verifyUser(request: HttpRequestType, userId: string): Promise<boolean> {
		return (await options.getSignedInUser(request))?.id === userId;
	}
});
export default appSessionUpstream;
