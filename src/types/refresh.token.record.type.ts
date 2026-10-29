'use strict';

type RefreshTokenRecordType = {
	tokenHash: string;
	familyId: string;
	clientId: string;
	userId: string;
	resource: string;
	usedAt?: Date;
	revokedAt?: Date;
	expiresAt: Date;
};
export default RefreshTokenRecordType;
