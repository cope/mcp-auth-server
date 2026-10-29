'use strict';

import type AuthorizationCodeRecordType from './authorization.code.record.type';
import type ClientRecordType from './client.record.type';
import type ConsentRecordType from './consent.record.type';
import type PendingAuthorizationType from './pending.authorization.type';
import type PendingFilterType from './pending.filter.type';
import type RefreshTokenRecordType from './refresh.token.record.type';

interface IStorage {
	getClient(clientId: string): Promise<ClientRecordType | null>;
	saveClient(client: ClientRecordType): Promise<void>;

	savePendingAuthorization(pending: PendingAuthorizationType): Promise<void>;
	getPendingAuthorization(stateId: string, now: Date): Promise<PendingAuthorizationType | null>;
	attachUserToPendingAuthorization(stateId: string, userId: string, now: Date, displayName?: string): Promise<PendingAuthorizationType | null>;
	takePendingAuthorization(stateId: string, filter: PendingFilterType): Promise<PendingAuthorizationType | null>;
	deletePendingAuthorization(stateId: string): Promise<void>;

	saveAuthorizationCode(code: AuthorizationCodeRecordType): Promise<void>;
	claimAuthorizationCode(codeHash: string, now: Date): Promise<AuthorizationCodeRecordType | null>;

	saveRefreshToken(token: RefreshTokenRecordType): Promise<void>;
	findRefreshToken(tokenHash: string): Promise<RefreshTokenRecordType | null>;
	claimRefreshToken(tokenHash: string, now: Date): Promise<RefreshTokenRecordType | null>;
	revokeRefreshTokenFamily(familyId: string, now: Date): Promise<void>;

	hasConsent(clientId: string, userId: string): Promise<boolean>;
	upsertConsent(consent: ConsentRecordType): Promise<void>;

	deleteExpired(now: Date): Promise<void>;
}
export default IStorage;
