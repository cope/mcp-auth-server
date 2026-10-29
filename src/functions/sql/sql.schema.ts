'use strict';

import type SqlDialectType from '../../types/sql.dialect.type';

const sqlSchema = (dialect: SqlDialectType, prefix: string = 'mcp_oauth_'): string[] => {
	const bigint: string = 'postgres' === dialect ? 'BIGINT' : 'INTEGER';
	return [
		`CREATE TABLE IF NOT EXISTS ${prefix}clients (
	client_id TEXT PRIMARY KEY,
	client_name TEXT,
	redirect_uris TEXT NOT NULL,
	application_type TEXT,
	token_endpoint_auth_method TEXT NOT NULL,
	grant_types TEXT NOT NULL,
	response_types TEXT NOT NULL,
	created_at ${bigint} NOT NULL
)`,
		`CREATE TABLE IF NOT EXISTS ${prefix}pending_authorizations (
	state_id TEXT PRIMARY KEY,
	client_id TEXT NOT NULL,
	client_name TEXT,
	redirect_uri TEXT NOT NULL,
	code_challenge TEXT NOT NULL,
	resource TEXT NOT NULL,
	client_state TEXT,
	upstream_code_verifier TEXT,
	user_id TEXT,
	user_display_name TEXT,
	expires_at ${bigint} NOT NULL
)`,
		`CREATE INDEX IF NOT EXISTS ${prefix}pending_expires_idx ON ${prefix}pending_authorizations (expires_at)`,
		`CREATE TABLE IF NOT EXISTS ${prefix}authorization_codes (
	code_hash TEXT PRIMARY KEY,
	client_id TEXT NOT NULL,
	redirect_uri TEXT NOT NULL,
	code_challenge TEXT NOT NULL,
	resource TEXT NOT NULL,
	user_id TEXT NOT NULL,
	used_at ${bigint},
	expires_at ${bigint} NOT NULL
)`,
		`CREATE INDEX IF NOT EXISTS ${prefix}codes_expires_idx ON ${prefix}authorization_codes (expires_at)`,
		`CREATE TABLE IF NOT EXISTS ${prefix}refresh_tokens (
	token_hash TEXT PRIMARY KEY,
	family_id TEXT NOT NULL,
	client_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	resource TEXT NOT NULL,
	used_at ${bigint},
	revoked_at ${bigint},
	expires_at ${bigint} NOT NULL
)`,
		`CREATE INDEX IF NOT EXISTS ${prefix}refresh_family_idx ON ${prefix}refresh_tokens (family_id)`,
		`CREATE INDEX IF NOT EXISTS ${prefix}refresh_expires_idx ON ${prefix}refresh_tokens (expires_at)`,
		`CREATE TABLE IF NOT EXISTS ${prefix}consents (
	client_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	created_at ${bigint} NOT NULL,
	PRIMARY KEY (client_id, user_id)
)`
	];
};
export default sqlSchema;
