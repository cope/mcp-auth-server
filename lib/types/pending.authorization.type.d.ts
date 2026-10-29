type PendingAuthorizationType = {
    stateId: string;
    clientId: string;
    clientName?: string;
    redirectUri: string;
    codeChallenge: string;
    resource: string;
    clientState?: string;
    upstreamCodeVerifier?: string;
    userId?: string;
    userDisplayName?: string;
    expiresAt: Date;
};
export default PendingAuthorizationType;
