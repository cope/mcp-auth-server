'use strict';

import type ClientMetadataType from '../types/client.metadata.type';
import type IMetadataCache from '../types/i.metadata.cache';

export default class LruMetadataCache implements IMetadataCache {
	private entries: Map<string, {value: ClientMetadataType; expiresAt: number}> = new Map();

	constructor(
		private readonly maxEntries: number = 500,
		private readonly now: () => number = Date.now
	) {}

	async get(url: string): Promise<ClientMetadataType | undefined> {
		const entry = this.entries.get(url);
		if (!entry) return undefined;
		if (entry.expiresAt <= this.now()) {
			this.entries.delete(url);
			return undefined;
		}
		this.entries.delete(url);
		this.entries.set(url, entry);
		return entry.value;
	}

	async set(url: string, value: ClientMetadataType, ttlSeconds: number): Promise<void> {
		this.entries.delete(url);
		this.entries.set(url, {value, expiresAt: this.now() + ttlSeconds * 1000});
		while (this.entries.size > this.maxEntries) this.entries.delete(this.entries.keys().next().value as string);
	}
}
