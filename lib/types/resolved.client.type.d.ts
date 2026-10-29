type ResolvedClientType = {
    clientId: string;
    clientName?: string;
    redirectUris: string[];
    metadataDocument: boolean;
};
export default ResolvedClientType;
