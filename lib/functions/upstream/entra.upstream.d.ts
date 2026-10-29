import type IUpstream from '../../types/i.upstream';
type EntraUpstreamOptionsType = {
    tenantId: string;
    clientId: string;
    clientSecret: string;
    scope?: string;
    fetch?: typeof fetch;
    now?: () => Date;
};
declare const entraUpstream: (options: EntraUpstreamOptionsType) => IUpstream;
export default entraUpstream;
