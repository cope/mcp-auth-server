'use strict';

type AccessTokenInputType = {issuer: string; resource: string; userId: string; clientId: string; ttlSeconds: number; now: Date};
export default AccessTokenInputType;
