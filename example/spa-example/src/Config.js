const BASE_URL =  window.location.origin;
const config ={
    LOGIN_URL: BASE_URL+"/backstage/v1/auth",
    LOGOUT_URL: BASE_URL+"/backstage/v1/auth/revoke",
    USER_INFO_URL: BASE_URL+"/backstage/v1/auth/user-info",
    GQL_URL: BASE_URL+"/backstage/v1/graphql",
    PROXY_URL: BASE_URL+"/backstage/v1/proxy",
}

export default config;
