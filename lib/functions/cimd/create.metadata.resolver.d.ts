import type CimdOptionsType from '../../types/cimd.options.type';
import type IMetadataCache from '../../types/i.metadata.cache';
import type MetadataResolutionType from '../../types/metadata.resolution.type';
declare const createMetadataResolver: (options: CimdOptionsType, cache: IMetadataCache) => ((clientId: string) => Promise<MetadataResolutionType>);
export default createMetadataResolver;
