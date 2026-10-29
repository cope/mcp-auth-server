import { JWTPayload } from 'jose';
declare const verifyIdToken: (token: string, loadJwks: (force: boolean) => Promise<any>, issuer: string, audience: string, now?: Date) => Promise<JWTPayload>;
export default verifyIdToken;
