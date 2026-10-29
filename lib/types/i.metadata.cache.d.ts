import type ClientMetadataType from './client.metadata.type';
interface IMetadataCache {
    get(url: string): Promise<ClientMetadataType | undefined>;
    set(url: string, value: ClientMetadataType, ttlSeconds: number): Promise<void>;
}
export default IMetadataCache;
