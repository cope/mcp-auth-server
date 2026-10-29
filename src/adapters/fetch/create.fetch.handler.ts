'use strict';

import type McpAuthType from '../../types/mcp.auth.type';
import toHttpRequest from './to.http.request';
import toResponse from './to.response';

const createFetchHandler =
	(auth: McpAuthType<any>) =>
	async (request: Request): Promise<Response | null> => {
		const parsed = await toHttpRequest(request);
		return auth.hasRoute(parsed) ? toResponse(await auth.handle(parsed)) : null;
	};
export default createFetchHandler;
