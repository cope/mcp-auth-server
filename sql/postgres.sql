CREATE TABLE IF NOT EXISTS mcp_oauth_clients (
	client_id TEXT PRIMARY KEY,
	client_name TEXT,
	redirect_uris TEXT NOT NULL,
	application_type TEXT,
	token_endpoint_auth_method TEXT NOT NULL,
	grant_types TEXT NOT NULL,
	response_types TEXT NOT NULL,
	created_at BIGINT NOT NULL
);

CREATE TABLE IF NOT EXISTS mcp_oauth_pending_authorizations (
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
	expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS mcp_oauth_pending_expires_idx ON mcp_oauth_pending_authorizations (expires_at);

CREATE TABLE IF NOT EXISTS mcp_oauth_authorization_codes (
	code_hash TEXT PRIMARY KEY,
	client_id TEXT NOT NULL,
	redirect_uri TEXT NOT NULL,
	code_challenge TEXT NOT NULL,
	resource TEXT NOT NULL,
	user_id TEXT NOT NULL,
	used_at BIGINT,
	expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS mcp_oauth_codes_expires_idx ON mcp_oauth_authorization_codes (expires_at);

CREATE TABLE IF NOT EXISTS mcp_oauth_refresh_tokens (
	token_hash TEXT PRIMARY KEY,
	family_id TEXT NOT NULL,
	client_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	resource TEXT NOT NULL,
	used_at BIGINT,
	revoked_at BIGINT,
	expires_at BIGINT NOT NULL
);

CREATE INDEX IF NOT EXISTS mcp_oauth_refresh_family_idx ON mcp_oauth_refresh_tokens (family_id);

CREATE INDEX IF NOT EXISTS mcp_oauth_refresh_expires_idx ON mcp_oauth_refresh_tokens (expires_at);

CREATE TABLE IF NOT EXISTS mcp_oauth_consents (
	client_id TEXT NOT NULL,
	user_id TEXT NOT NULL,
	created_at BIGINT NOT NULL,
	PRIMARY KEY (client_id, user_id)
);
