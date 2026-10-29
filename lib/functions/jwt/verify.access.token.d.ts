import type KeyPairType from '../../types/key.pair.type';
import type VerifyResultType from '../../types/verify.result.type';
declare const verifyAccessToken: (keys: KeyPairType, token: string, issuer: string, resource: string, now: Date) => Promise<VerifyResultType>;
export default verifyAccessToken;
