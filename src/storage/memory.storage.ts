'use strict';

import type AuthorizationCodeRecordType from '../types/authorization.code.record.type';
import type ClientRecordType from '../types/client.record.type';
import type ConsentRecordType from '../types/consent.record.type';
import type IStorage from '../types/i.storage';
import type PendingAuthorizationType from '../types/pending.authorization.type';
import type PendingFilterType from '../types/pending.filter.type';
import type RefreshTokenRecordType from '../types/refresh.token.record.type';

export default class MemoryStorage implements IStorage {
	private clients: Map<string, ClientRecordType> = new Map();
	private pending: Map<string, PendingAuthorizationType> = new Map();
	private codes: Map<string, AuthorizationCodeRecordType> = new Map();
	private refreshTokens: Map<string, RefreshTokenRecordType> = new Map();
	private consents: Set<string> = new Set();

	async getClient(clientId: string): Promise<ClientRecordType | null> {
		const client = this.clients.get(clientId);
		return client ? {...client} : null;
	}

	async saveClient(client: ClientRecordType): Promise<void> {
		this.clients.set(client.clientId, {...client});
	}

	async savePendingAuthorization(pending: PendingAuthorizationType): Promise<void> {
		this.pending.set(pending.stateId, {...pending});
	}

	async getPendingAuthorization(stateId: string, now: Date): Promise<PendingAuthorizationType | null> {
		const found = this.pending.get(stateId);
		return found && found.expiresAt > now ? {...found} : null;
	}

	async attachUserToPendingAuthorization(stateId: string, userId: string, now: Date, displayName?: string): Promise<PendingAuthorizationType | null> {
		const found = this.pending.get(stateId);
		if (!found || found.expiresAt <= now || found.userId) return null;
		found.userId = userId;
		found.userDisplayName = displayName;
		return {...found};
	}

	async takePendingAuthorization(stateId: string, filter: PendingFilterType): Promise<PendingAuthorizationType | null> {
		const found = this.pending.get(stateId);
		if (!found || found.expiresAt <= filter.now) return null;
		if (undefined !== filter.hasUser && filter.hasUser !== !!found.userId) return null;
		this.pending.delete(stateId);
		return {...found};
	}

	async deletePendingAuthorization(stateId: string): Promise<void> {
		this.pending.delete(stateId);
	}

	async saveAuthorizationCode(code: AuthorizationCodeRecordType): Promise<void> {
		this.codes.set(code.codeHash, {...code});
	}

	async claimAuthorizationCode(codeHash: string, now: Date): Promise<AuthorizationCodeRecordType | null> {
		const found = this.codes.get(codeHash);
		if (!found || found.usedAt || found.expiresAt <= now) return null;
		found.usedAt = now;
		return {...found};
	}

	async saveRefreshToken(token: RefreshTokenRecordType): Promise<void> {
		this.refreshTokens.set(token.tokenHash, {...token});
	}

	async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecordType | null> {
		const found = this.refreshTokens.get(tokenHash);
		return found ? {...found} : null;
	}

	async claimRefreshToken(tokenHash: string, now: Date): Promise<RefreshTokenRecordType | null> {
		const found = this.refreshTokens.get(tokenHash);
		if (!found || found.usedAt || found.revokedAt || found.expiresAt <= now) return null;
		found.usedAt = now;
		return {...found};
	}

	async revokeRefreshTokenFamily(familyId: string, now: Date): Promise<void> {
		for (const token of this.refreshTokens.values()) if (token.familyId === familyId && !token.revokedAt) token.revokedAt = now;
	}

	async hasConsent(clientId: string, userId: string): Promise<boolean> {
		return this.consents.has(JSON.stringify([clientId, userId]));
	}

	async upsertConsent(consent: ConsentRecordType): Promise<void> {
		this.consents.add(JSON.stringify([consent.clientId, consent.userId]));
	}

	async deleteExpired(now: Date): Promise<void> {
		for (const [key, value] of this.pending) if (value.expiresAt <= now) this.pending.delete(key);
		for (const [key, value] of this.codes) if (value.expiresAt <= now) this.codes.delete(key);
		for (const [key, value] of this.refreshTokens) if (value.expiresAt <= now) this.refreshTokens.delete(key);
	}
}
