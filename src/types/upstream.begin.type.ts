'use strict';

import type AuthenticatedUserType from './authenticated.user.type';

type UpstreamBeginType = {type: 'redirect'; url: string} | {type: 'user'; user: AuthenticatedUserType};
export default UpstreamBeginType;
