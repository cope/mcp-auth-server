type ConsentModelType = {
    action: string;
    state: string;
    clientId: string;
    clientName?: string;
    clientHost?: string;
    metadataDocument: boolean;
    redirectUri: string;
    redirectTarget: string;
    redirectIsLocalhost: boolean;
    userDisplayName?: string;
    productName: string;
    environmentLabel?: string;
};
export default ConsentModelType;
