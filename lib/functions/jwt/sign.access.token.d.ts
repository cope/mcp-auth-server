import type AccessTokenInputType from '../../types/access.token.input.type';
import type KeyPairType from '../../types/key.pair.type';
declare const signAccessToken: (keys: KeyPairType, input: AccessTokenInputType) => Promise<string>;
export default signAccessToken;
