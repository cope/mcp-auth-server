type VerifyResultType = {
    claims: Record<string, unknown>;
} | {
    reason: 'expired' | 'invalid_token';
};
export default VerifyResultType;
