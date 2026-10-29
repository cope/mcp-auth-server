type AuthenticateResultType<TUser> = {
    user: TUser;
    claims: Record<string, unknown>;
} | {
    status: 401;
    headers: Record<string, string>;
    body: unknown;
    reason: string;
};
export default AuthenticateResultType;
