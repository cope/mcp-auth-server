'use strict';

import optionalDate from '../functions/sql/optional.date';
import rowToClient from '../functions/sql/row.to.client';
import rowToCode from '../functions/sql/row.to.code';
import rowToPending from '../functions/sql/row.to.pending';
import rowToRefreshToken from '../functions/sql/row.to.refresh.token';
import sqlSchema from '../functions/sql/sql.schema';
import toDialectSql from '../functions/sql/to.dialect.sql';
import type AuthorizationCodeRecordType from '../types/authorization.code.record.type';
import type ClientRecordType from '../types/client.record.type';
import type ConsentRecordType from '../types/consent.record.type';
import type IStorage from '../types/i.storage';
import type PendingAuthorizationType from '../types/pending.authorization.type';
import type PendingFilterType from '../types/pending.filter.type';
import type RefreshTokenRecordType from '../types/refresh.token.record.type';
import type SqlDialectType from '../types/sql.dialect.type';
import type SqlExecutorType from '../types/sql.executor.type';
import type {SqlRowType} from '../types/sql.executor.type';
import type SqlStorageOptionsType from '../types/sql.storage.options.type';

export default class SqlStorage implements IStorage {
	private readonly prefix: string;

	constructor(
		private readonly executor: SqlExecutorType,
		private readonly dialect: SqlDialectType,
		options: SqlStorageOptionsType = {}
	) {
		this.prefix = options.tablePrefix ?? 'mcp_oauth_';
	}

	async migrate(): Promise<void> {
		for (const statement of sqlSchema(this.dialect, this.prefix)) await this.run(statement, []);
	}

	private async run(sql: string, params: unknown[]): Promise<SqlRowType[]> {
		return (await this.executor(toDialectSql(sql, this.dialect), params)) ?? [];
	}

	private async first(sql: string, params: unknown[]): Promise<SqlRowType | undefined> {
		return (await this.run(sql, params))[0];
	}

	async getClient(clientId: string): Promise<ClientRecordType | null> {
		const row = await this.first(`SELECT * FROM ${this.prefix}clients WHERE client_id = ?`, [clientId]);
		return row ? rowToClient(row) : null;
	}

	async saveClient(client: ClientRecordType): Promise<void> {
		await this.run(
			`INSERT INTO ${this.prefix}clients (client_id, client_name, redirect_uris, application_type, token_endpoint_auth_method, grant_types, response_types, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				client.clientId,
				client.clientName ?? null,
				JSON.stringify(client.redirectUris),
				client.applicationType ?? null,
				client.tokenEndpointAuthMethod,
				JSON.stringify(client.grantTypes),
				JSON.stringify(client.responseTypes),
				client.createdAt.getTime()
			]
		);
	}

	async savePendingAuthorization(pending: PendingAuthorizationType): Promise<void> {
		await this.run(
			`INSERT INTO ${this.prefix}pending_authorizations (state_id, client_id, client_name, redirect_uri, code_challenge, resource, client_state, upstream_code_verifier, user_id, user_display_name, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
			[
				pending.stateId,
				pending.clientId,
				pending.clientName ?? null,
				pending.redirectUri,
				pending.codeChallenge,
				pending.resource,
				pending.clientState ?? null,
				pending.upstreamCodeVerifier ?? null,
				pending.userId ?? null,
				pending.userDisplayName ?? null,
				pending.expiresAt.getTime()
			]
		);
	}

	async getPendingAuthorization(stateId: string, now: Date): Promise<PendingAuthorizationType | null> {
		const row = await this.first(`SELECT * FROM ${this.prefix}pending_authorizations WHERE state_id = ? AND expires_at > ?`, [stateId, now.getTime()]);
		return row ? rowToPending(row) : null;
	}

	async attachUserToPendingAuthorization(stateId: string, userId: string, now: Date, displayName?: string): Promise<PendingAuthorizationType | null> {
		const row = await this.first(
			`UPDATE ${this.prefix}pending_authorizations SET user_id = ?, user_display_name = ? WHERE state_id = ? AND expires_at > ? AND user_id IS NULL RETURNING *`,
			[userId, displayName ?? null, stateId, now.getTime()]
		);
		return row ? rowToPending(row) : null;
	}

	async takePendingAuthorization(stateId: string, filter: PendingFilterType): Promise<PendingAuthorizationType | null> {
		let userClause: string = '';
		if (true === filter.hasUser) userClause = ' AND user_id IS NOT NULL';
		if (false === filter.hasUser) userClause = ' AND user_id IS NULL';
		const row = await this.first(`DELETE FROM ${this.prefix}pending_authorizations WHERE state_id = ? AND expires_at > ?${userClause} RETURNING *`, [
			stateId,
			filter.now.getTime()
		]);
		return row ? rowToPending(row) : null;
	}

	async deletePendingAuthorization(stateId: string): Promise<void> {
		await this.run(`DELETE FROM ${this.prefix}pending_authorizations WHERE state_id = ?`, [stateId]);
	}

	async saveAuthorizationCode(code: AuthorizationCodeRecordType): Promise<void> {
		await this.run(
			`INSERT INTO ${this.prefix}authorization_codes (code_hash, client_id, redirect_uri, code_challenge, resource, user_id, used_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[code.codeHash, code.clientId, code.redirectUri, code.codeChallenge, code.resource, code.userId, optionalDate(code.usedAt), code.expiresAt.getTime()]
		);
	}

	async claimAuthorizationCode(codeHash: string, now: Date): Promise<AuthorizationCodeRecordType | null> {
		const row = await this.first(`UPDATE ${this.prefix}authorization_codes SET used_at = ? WHERE code_hash = ? AND used_at IS NULL AND expires_at > ? RETURNING *`, [
			now.getTime(),
			codeHash,
			now.getTime()
		]);
		return row ? rowToCode(row) : null;
	}

	async saveRefreshToken(token: RefreshTokenRecordType): Promise<void> {
		await this.run(
			`INSERT INTO ${this.prefix}refresh_tokens (token_hash, family_id, client_id, user_id, resource, used_at, revoked_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
			[token.tokenHash, token.familyId, token.clientId, token.userId, token.resource, optionalDate(token.usedAt), optionalDate(token.revokedAt), token.expiresAt.getTime()]
		);
	}

	async findRefreshToken(tokenHash: string): Promise<RefreshTokenRecordType | null> {
		const row = await this.first(`SELECT * FROM ${this.prefix}refresh_tokens WHERE token_hash = ?`, [tokenHash]);
		return row ? rowToRefreshToken(row) : null;
	}

	async claimRefreshToken(tokenHash: string, now: Date): Promise<RefreshTokenRecordType | null> {
		const row = await this.first(
			`UPDATE ${this.prefix}refresh_tokens SET used_at = ? WHERE token_hash = ? AND used_at IS NULL AND revoked_at IS NULL AND expires_at > ? RETURNING *`,
			[now.getTime(), tokenHash, now.getTime()]
		);
		return row ? rowToRefreshToken(row) : null;
	}

	async revokeRefreshTokenFamily(familyId: string, now: Date): Promise<void> {
		await this.run(`UPDATE ${this.prefix}refresh_tokens SET revoked_at = ? WHERE family_id = ? AND revoked_at IS NULL`, [now.getTime(), familyId]);
	}

	async hasConsent(clientId: string, userId: string): Promise<boolean> {
		return !!(await this.first(`SELECT 1 AS found FROM ${this.prefix}consents WHERE client_id = ? AND user_id = ?`, [clientId, userId]));
	}

	async upsertConsent(consent: ConsentRecordType): Promise<void> {
		await this.run(`INSERT INTO ${this.prefix}consents (client_id, user_id, created_at) VALUES (?, ?, ?) ON CONFLICT (client_id, user_id) DO NOTHING`, [
			consent.clientId,
			consent.userId,
			Date.now()
		]);
	}

	async deleteExpired(now: Date): Promise<void> {
		for (const table of ['pending_authorizations', 'authorization_codes', 'refresh_tokens']) {
			await this.run(`DELETE FROM ${this.prefix}${table} WHERE expires_at <= ?`, [now.getTime()]);
		}
	}
}
