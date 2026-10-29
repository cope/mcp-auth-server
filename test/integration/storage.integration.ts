'use strict';

import {PGlite} from '@electric-sql/pglite';
import BetterSqlite3 from 'better-sqlite3';
import {MongoClient} from 'mongodb';
import {MongoMemoryServer} from 'mongodb-memory-server';
import {DatabaseSync} from 'node:sqlite';
import {Pool} from 'pg';

import fromBetterSqlite3 from '../../src/functions/sql/from.better.sqlite3';
import fromNodeSqlite from '../../src/functions/sql/from.node.sqlite';
import fromPg from '../../src/functions/sql/from.pg';
import MongoStorage from '../../src/storage/mongodb.storage';
import SqlStorage from '../../src/storage/sql.storage';
import type IStorage from '../../src/types/i.storage';
import type MongoStorageOptionsType from '../../src/types/mongo.storage.options.type';
import storageScenarios from '../helpers/storage.scenarios';

type InstanceType = {storage: IStorage; close: () => Promise<void>};
type BackendType = {name: string; create: (index: number) => Promise<InstanceType>; dispose?: () => Promise<void>};

const sysToolsMapping: MongoStorageOptionsType = {userIdField: 'employeeId', userIdToDb: (userId) => Number(userId), userIdFromDb: (value) => String(value)};
const tables = ['clients', 'pending_authorizations', 'authorization_codes', 'refresh_tokens', 'consents'];

const mongoBackends = async (): Promise<BackendType[]> => {
	const server = await MongoMemoryServer.create();
	const client = await MongoClient.connect(server.getUri());
	const create =
		(options?: MongoStorageOptionsType) =>
		async (index: number): Promise<InstanceType> => {
			const storage = new MongoStorage(client.db(`scenario_${index}_${Date.now()}`), options);
			await storage.ensureIndexes();
			return {storage, close: async () => undefined};
		};
	const dispose = async (): Promise<void> => {
		await client.close();
		await server.stop();
	};
	return [
		{name: 'mongodb', create: create(), dispose},
		{name: 'mongodb (employeeId number mapping)', create: create(sysToolsMapping)}
	];
};

const postgresBackend = (): BackendType => {
	const url = process.env.MCP_AUTH_PG_URL;
	if (url) {
		const pool = new Pool({connectionString: url});
		return {
			name: 'postgres (pg)',
			create: async () => {
				const storage = new SqlStorage(fromPg(pool), 'postgres');
				await storage.migrate();
				const truncate = 'TRUNCATE ' + tables.map((table) => 'mcp_oauth_' + table).join(', ');
				await pool.query(truncate);
				return {storage, close: async () => undefined};
			},
			dispose: async () => pool.end()
		};
	}
	return {
		name: 'postgres (pglite)',
		create: async () => {
			const pg = new PGlite();
			const storage = new SqlStorage(async (sql, params) => (await pg.query(sql, params)).rows as Record<string, unknown>[], 'postgres');
			await storage.migrate();
			return {storage, close: async () => pg.close()};
		}
	};
};

const sqliteBackends = (): BackendType[] => [
	{
		name: 'sqlite (better-sqlite3)',
		create: async () => {
			const db = new BetterSqlite3(':memory:');
			const storage = new SqlStorage(fromBetterSqlite3(db), 'sqlite');
			await storage.migrate();
			return {
				storage,
				close: async () => {
					db.close();
				}
			};
		}
	},
	{
		name: 'sqlite (node:sqlite)',
		create: async () => {
			const db = new DatabaseSync(':memory:');
			const storage = new SqlStorage(fromNodeSqlite(db), 'sqlite');
			await storage.migrate();
			return {storage, close: async () => db.close()};
		}
	}
];

const runBackend = async (backend: BackendType): Promise<number> => {
	let failures = 0;
	for (const [index, scenario] of storageScenarios.entries()) {
		const instance = await backend.create(index);
		try {
			await scenario.run(instance.storage);
			console.log(`ok    ${backend.name} :: ${scenario.name}`);
		} catch (error) {
			failures += 1;
			console.log(`FAIL  ${backend.name} :: ${scenario.name}\n${(error as Error).stack}`);
		} finally {
			await instance.close();
		}
	}
	return failures;
};

const main = async (): Promise<number> => {
	const backends = [...(await mongoBackends()), postgresBackend(), ...sqliteBackends()];
	let failures = 0;
	try {
		for (const backend of backends) failures += await runBackend(backend);
	} finally {
		for (const backend of backends) await backend.dispose?.();
	}
	console.log(failures ? `${failures} scenario(s) failed` : `all ${backends.length * storageScenarios.length} scenarios passed`);
	return failures;
};

main().then(
	(failures) => process.exit(failures ? 1 : 0),
	(error) => {
		console.error(error);
		process.exit(1);
	}
);
