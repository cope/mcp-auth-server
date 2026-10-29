'use strict';

import type ClientMetadataType from './client.metadata.type';

type MetadataResolutionType = {ok: true; metadata: ClientMetadataType} | {ok: false; reason: string};
export default MetadataResolutionType;
