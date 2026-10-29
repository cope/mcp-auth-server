import type KeyPairType from '../../types/key.pair.type';
declare const resolveKeyPair: (signingKey: CryptoKey | string, verificationKey?: CryptoKey) => Promise<KeyPairType>;
export default resolveKeyPair;
