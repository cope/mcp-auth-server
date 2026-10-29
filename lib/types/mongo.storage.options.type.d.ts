type MongoStorageOptionsType = {
    collections?: {
        clients?: string;
        pendingAuthorizations?: string;
        authorizationCodes?: string;
        refreshTokens?: string;
        consents?: string;
    };
    userIdField?: string;
    userIdToDb?: (userId: string) => unknown;
    userIdFromDb?: (value: unknown) => string;
};
export default MongoStorageOptionsType;
