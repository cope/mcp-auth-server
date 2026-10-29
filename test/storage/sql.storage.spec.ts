'use strict';

import BetterSqlite3 from 'better-sqlite3';
import {DatabaseSync} from 'node:sqlite';

import fromBetterSqlite3 from '../../src/functions/sql/from.better.sqlite3';
import fromNodeSqlite from '../../src/functions/sql/from.node.sqlite';
import SqlStorage from '../../src/storage/sql.storage';
import type SqlExecutorType from '../../src/types/sql.executor.type';
import {storageContract} from '../helpers/storage.contract';

const now = new Date('2026-01-01T00:00:00Z');
const later = new Date(now.getTime() + 60_000);

const pendingRecord = {
	stateId: 's1',
	clientId: 'c1',
	redirectUri: 'https://a/cb',
	codeChallenge: 'ch',
	resource: 'r',
	expiresAt: later
};

const recorder = (rows: Record<string, unknown>[] | undefined = []) => {
	const calls: {sql: string; params: unknown[]}[] = [];
	const executor: SqlExecutorType = async (sql, params) => {
		calls.push({sql, params});
		return rows as Record<string, unknown>[];
	};
	return {calls, executor};
};

storageContract('sql.storage (node:sqlite)', async () => {
	const storage = new SqlStorage(fromNodeSqlite(new DatabaseSync(':memory:')), 'sqlite');
	await storage.migrate();
	return storage;
});

storageContract('sql.storage (better-sqlite3)', async () => {
	const storage = new SqlStorage(fromBetterSqlite3(new BetterSqlite3(':memory:')), 'sqlite');
	await storage.migrate();
	return storage;
});

describe('sql.storage tests', () => {
	it('should be defined', () => {
		expect(SqlStorage).toBeDefined();
		expect(new SqlStorage(recorder().executor, 'sqlite')).toBeInstanceOf(SqlStorage);
	});

	it('should run every schema statement on migrate', async () => {
		const {calls, executor} = recorder();
		await new SqlStorage(executor, 'sqlite').migrate();
		expect(calls).toHaveLength(9);
		expect(calls[0].sql).toContain('CREATE TABLE IF NOT EXISTS mcp_oauth_clients');
	});

	it('should convert placeholders to numbered parameters for postgres', async () => {
		const {calls, executor} = recorder();
		await new SqlStorage(executor, 'postgres').getClient('c1');
		expect(calls[0]).toEqual({sql: 'SELECT * FROM mcp_oauth_clients WHERE client_id = $1', params: ['c1']});
	});

	it('should keep question marks for sqlite', async () => {
		const {calls, executor} = recorder();
		await new SqlStorage(executor, 'sqlite').getClient('c1');
		expect(calls[0].sql).toBe('SELECT * FROM mcp_oauth_clients WHERE client_id = ?');
	});

	it('should honour the table prefix', async () => {
		const {calls, executor} = recorder();
		const storage = new SqlStorage(executor, 'postgres', {tablePrefix: 'x_'});
		await storage.migrate();
		await storage.deleteExpired(now);
		expect(calls[0].sql).toContain('x_clients');
		expect(calls.at(-1)?.sql).toBe('DELETE FROM x_refresh_tokens WHERE expires_at <= $1');
		expect(calls.at(-3)?.sql).toBe('DELETE FROM x_pending_authorizations WHERE expires_at <= $1');
	});

	it('should treat an undefined executor result as no rows', async () => {
		const executor: SqlExecutorType = async () => undefined as unknown as Record<string, unknown>[];
		const storage = new SqlStorage(executor, 'postgres');
		expect(await storage.getClient('c1')).toBeNull();
		expect(await storage.hasConsent('c1', 'u1')).toBe(false);
	});

	it('should treat an empty executor result as no rows', async () => {
		const storage = new SqlStorage(recorder([]).executor, 'postgres');
		expect(await storage.claimAuthorizationCode('h', now)).toBeNull();
		expect(await storage.hasConsent('c1', 'u1')).toBe(false);
	});

	it('should report consent when a row is returned', async () => {
		expect(await new SqlStorage(recorder([{found: 1}]).executor, 'postgres').hasConsent('c1', 'u1')).toBe(true);
	});

	it('should map bigint strings returned by postgres drivers', async () => {
		const row = {state_id: 's1', client_id: 'c1', redirect_uri: 'u', code_challenge: 'ch', resource: 'r', expires_at: String(later.getTime())};
		const found = await new SqlStorage(recorder([row]).executor, 'postgres').getPendingAuthorization('s1', now);
		expect(found?.expiresAt.getTime()).toBe(later.getTime());
	});

	it('should require a user on takePending when hasUser is true', async () => {
		const {calls, executor} = recorder();
		await new SqlStorage(executor, 'postgres').takePendingAuthorization('s1', {now, hasUser: true});
		expect(calls[0].sql).toBe('DELETE FROM mcp_oauth_pending_authorizations WHERE state_id = $1 AND expires_at > $2 AND user_id IS NOT NULL RETURNING *');
		expect(calls[0].params).toEqual(['s1', now.getTime()]);
	});

	it('should require no user on takePending when hasUser is false', async () => {
		const {calls, executor} = recorder();
		await new SqlStorage(executor, 'postgres').takePendingAuthorization('s1', {now, hasUser: false});
		expect(calls[0].sql).toBe('DELETE FROM mcp_oauth_pending_authorizations WHERE state_id = $1 AND expires_at > $2 AND user_id IS NULL RETURNING *');
	});

	it('should not filter on the user on takePending when hasUser is undefined', async () => {
		const {calls, executor} = recorder();
		await new SqlStorage(executor, 'postgres').takePendingAuthorization('s1', {now});
		expect(calls[0].sql).toBe('DELETE FROM mcp_oauth_pending_authorizations WHERE state_id = $1 AND expires_at > $2 RETURNING *');
	});

	it('should write nulls for missing optional values', async () => {
		const {calls, executor} = recorder();
		const storage = new SqlStorage(executor, 'sqlite');
		await storage.savePendingAuthorization(pendingRecord);
		await storage.saveClient({clientId: 'c1', redirectUris: [], tokenEndpointAuthMethod: 'none', grantTypes: [], responseTypes: [], createdAt: now});
		expect(calls[0].params).toEqual(['s1', 'c1', null, 'https://a/cb', 'ch', 'r', null, null, null, null, later.getTime()]);
		expect(calls[1].params[1]).toBeNull();
		expect(calls[1].params[3]).toBeNull();
	});
});
