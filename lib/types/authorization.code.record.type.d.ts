type AuthorizationCodeRecordType = {
    codeHash: string;
    clientId: string;
    redirectUri: string;
    codeChallenge: string;
    resource: string;
    userId: string;
    usedAt?: Date;
    expiresAt: Date;
};
export default AuthorizationCodeRecordType;
