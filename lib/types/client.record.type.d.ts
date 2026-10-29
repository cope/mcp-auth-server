type ClientRecordType = {
    clientId: string;
    clientName?: string;
    redirectUris: string[];
    applicationType?: string;
    tokenEndpointAuthMethod: 'none';
    grantTypes: string[];
    responseTypes: string[];
    createdAt: Date;
};
export default ClientRecordType;
