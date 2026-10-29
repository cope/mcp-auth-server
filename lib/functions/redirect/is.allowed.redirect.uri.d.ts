import type RedirectPolicyType from '../../types/redirect.policy.type';
declare const isAllowedRedirectUri: (redirectUri: unknown, policy: RedirectPolicyType) => boolean;
export default isAllowedRedirectUri;
