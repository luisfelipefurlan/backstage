const endpointOIDC = (realm) => `/realms/${realm}/protocol/openid-connect`;

const buildOIDCURL = (url, realm) => `${url}${endpointOIDC(realm)}`;


/**
 * Built external URL for browser login
 *
 * @param {object} param0
 * @param {string} param0.baseUrl Start URL
 * @param {string} param0.redirectUri URL to redirect
 * @param {string} param0.realm Realm
 * @param {string} param0.clientId clientId
 * @param {string} param0.codeChallenge codeChallenge
 * @param {string} param0.codeChallengeMethod codeChallengeMethod
 * @param {string} param0.codeChallengeMethod codeChallengeMethod
 * @returns
 */
const buildUrlLogin = ({
  baseUrl,
  clientId,
  realm,
  state,
  codeChallenge,
  codeChallengeMethod,
  redirectUri,
}) => {
  const url = new URL(`${buildOIDCURL(baseUrl, realm)}/auth?`);

  url.searchParams.append('client_id', clientId);
  url.searchParams.append('response_type', 'code');
  url.searchParams.append('scope', 'openid');
  url.searchParams.append('state', state);
  url.searchParams.append('code_challenge', codeChallenge);
  url.searchParams.append('code_challenge_method', codeChallengeMethod);
  url.searchParams.append('redirect_uri', redirectUri);

  return url.href;
};

/**
 * Built external URL for browser logout
 *
 * @param {object} param0
 * @param {string} param0.baseUrl Start URL
 * @param {string} param0.redirectUri URL to redirect
 * @param {string} param0.realm Realm
 * @returns
 */
const buildUrlLogout = ({
  baseUrl,
  redirectUri,
  realm,
}) => {
  const url = new URL(`${buildOIDCURL(baseUrl, realm)}/logout?`);
  url.searchParams.append('redirect_uri', redirectUri);

  return url.href;
};

module.exports = {
  buildUrlLogin,
  buildUrlLogout,
  endpointOIDC,
};
