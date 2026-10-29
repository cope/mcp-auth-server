import type ClientMetadataType from '../types/client.metadata.type';
import type IMetadataCache from '../types/i.metadata.cache';
export default class LruMetadataCache implements IMetadataCache {
    private readonly maxEntries;
    private readonly now;
    private entries;
    constructor(maxEntries?: number, now?: () => number);
    get(url: string): Promise<ClientMetadataType | undefined>;
    set(url: string, value: ClientMetadataType, ttlSeconds: number): Promise<void>;
}
