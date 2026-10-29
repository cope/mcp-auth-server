type ClientMetadataType = {
    client_id: string;
    client_name: string;
    redirect_uris: string[];
    [key: string]: unknown;
};
export default ClientMetadataType;
