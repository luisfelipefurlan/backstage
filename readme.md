# Backstage

[![Docker badge](https://img.shields.io/docker/pulls/dojot/backstage.svg)](https://hub.docker.com/r/dojot/backstage/) [![DeepScan grade](https://deepscan.io/api/teams/2714/projects/3991/branches/33559/badge/grade.svg)](https://deepscan.io/dashboard#view=project&tid=2714&pid=3991&bid=33559) [![CodeFactor](https://www.codefactor.io/repository/github/dojot/backstage/badge)](https://www.codefactor.io/repository/github/dojot/backstage) [![codecov](https://codecov.io/gh/dojot/backstage/branch/development/graph/badge.svg)](https://codecov.io/gh/dojot/backstage) [![License badge](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)

The **Backstage** is intended to be an intermediary between the dojot and Keycloak APIs for the GUIs.

## **Table of Contents**

- [Overview](#overview)
- [Attention](#attention)
- [Dependencies](#dependencies)
  - [Dojot Services](#dojot-services)
  - [Others Services](#others-services)
- [Rest API](#rest-api)
- [Keycloak](#keycloak)
- [GraphQL](#graphql)
- [Proxy](#proxy)
- [Running the service](#running-the-service)
  - [Configurations](#configurations)
    - [General Configurations](#general-configurations)
    - [Server Configurations](#server-configurations)
    - [Keycloak Configurations](#keycloak-configurations)
    - [Session Configurations](#session-configurations)
    - [Redis Configurations](#redis-configurations)
    - [Postgres Configurations](#postgres-configurations)
    - [Proxy Configurations](#proxy-configurations)
    - [Service State Manager](#service-state-manager)
  - [How to run](#how-to-run)
- [Documentation](#documentation)
- [Issues and help](#issues-and-help)
- [Example](#example)
- [License](#license)

## Overview

Backstage is a backend for the frontend. Currently it has two main roles, one is to maintain the session with information as an access token only on the backend, thus ensuring more security and another role is to manipulate the data in order to be simpler to be consumed on the frontend, thus reducing processing load in the client's browser.

## Attention

__Attention__ The configurable value `session.secret`, used to sign the session ID, **must be unique for each environment and always configured**, if not configured via the configuration file or environment variable `BS_SESSION_SECRET`, the service will not be able to start. Give preference to large random values. Also note that in a cluster environment all instances must share the same secret.

## Dependencies

The services dependencies are listed in the next topics.

- Dojot Services
- Others Services: They are external services;

### Dojot Services

- [Kong from dojot](https://github.com/dojot/dojot/tree/master/api-gateway/kong): Although [Kong](https://konghq.com/kong/) is not a mandatory dependency, the solution was designed using it together with a pepkong plugin from dojot to guarantee authorization when accessing resources. (tested using Dojot version v0.7)

### Others Services

- [Keycloak](https://www.keycloak.org/) (tested using Keycloak version 12.0.x)
- [Redis](https://redis.io/) (tested using Redis version 6.0.4)
- [Postgres](https://www.postgresql.org/) (tested using Postgres version 9.5)

## Rest API

The link to the API documentation for the available endpoints:

- [Latest Backstage Retriever API documentation](https://dojot.github.io/backstage/api/doc.html)
- [Development Backstage Retriever API documentation](https://dojot.github.io/backstage/api/doc.html?version=development)

In addition, there is an endpoint for using version 1 documentation (the only one so far) interactively. The url to use it follows this pattern:

``http{s}://{host}:{port}/backstage/v1/api-docs/``

For example, the address could be:

`http://localhost:3000/backstage/v1/api-docs/`

## Keycloak

Keycloak implements the OAuth 2.0 and OpenID Connect protocols, has its own customizable login screen and a tenant in the dojot is equivalent to a `realm` in Keycloak.

The Backstage will use the Keycloak to execute the  [Proof Key for Code Exchange flow, PKCE](https://oauth.net/2/pkce/),  is an extension to the [Authorization Code flow](https://oauth.net/2/grant-types/authorization-code/). In order to obtain greater security, the proposal is that the Access Token and the Refresh Token are accessible only in Backstage and kept in Redis. Another important point is that to identify the session between the browser and the backstage, an HttpOnly cookie will be used, and in that cookie there will be a session identification. It is recommended that this cookie only accepts HTTPS connections.

The backstage also controls the time of the active session, obtain new Access Tokens from the Refresh Token, make available information about permissions associated with the user and information about the user (login, email, name). When it comes to active session management, the idea is to have an active session with a maximum of `session.redis.max.life.time.sec` and a maximum idle of `session.redis.max.idle.time.sec`. Whenever a new request is made the maximum idle time is restarted, if this time passes without there being a request the user will have to make a new login, as well as if maximum active session time ends.

### Requirements

- Have a public client registered in the Keycloak the value can be set in `keycloak.public.client.id`
- If you are using kong with the dojot plugin, pepkong, when registering resources/endpoints in Kong, define which ones are safe, they need authentication and authorization (a valid token and permission to access). Whenever a request is made passing through Kong in one of these resources that need authentication and authorization, a plugin is executed in Kong that checks in the Keycloak if the token in the header can access the resource/endpoint that it is intending to access, in case it cannot return an error.

### Architecture

The architecture of the integration of the Keycloak with the GUIs (SPAs) is shown in Figure 1, it is important to note that dojot APIs comprise all the features/APIs available in the dojot that require authorization using Token and that the data received from the APIs of dojot by Backstage can be processed before being sent to GUIs.

![Figure 1 - Integration architecture](./docs/imgs/arq.png)

### Main flows

The sequence diagram (figure 2) shows the main flows and below the figure are explained point by point the diagram.

![Figure 2 - Sequence diagram with some flows](./docs/imgs/flux.png)

1. Flow of obtaining login screen
   1. User clicks on login and the GUI receives the click;
   1. The GUI makes a GET request for the `<app.base.url>/backstage/v1/auth?tenant=$TENANT&state=$STATE` endpoint in the Backstage;
   1. The backstage creates a session cookie; generates the code verifier and code challenge pair; creates a record in Redis to save session data with the prefix key `session.redis.key.prefix.name.max.life` and suffix session identifier, for example `session:abcde`; this register has valid for `session.redis.max.life.time.sec`, ttl;  another record is also created with prefix key `session.redis.key.prefix.name.max.idle` and suffix session identifier, for example `session-idle:abcde` with`session.redis.max.login.return.time.sec` as validity, ttl and this record has no data;
   1. It returns a redirect to the login screen with code 303 for `<keycloak.url.external>/realms/$TENANT/protocol/openid-connect/auth?client_id=<keycloak.public.client.id>&redirect_uri=<app.base.url>/backstage/v1/auth/return&state=$STATE&response_type=code&scope=openid&code_challenge=$CODE_CHALLENGE&code_challenge_method=<keycloak.code.challenge.method>`
2. Login data sending flow
   1. The user places his login and password, and sends it to the keycloak. If they are valid, the keycloak continues the flow and redirects to the URL via GET defined in redirect_uri, in the case `<app.base.url>/backstage/v1/auth/return`,passing the Authorization Code and State in the QueryString of the URL.
   1. The Backstage `<app.base.url>/backstage/v1/auth/return` endpoint receives the Authorization Code. (As much as the request is made for the backend, the return happens in the browser and the authorization code is exposed, which is not a problem since we have the PKCE verification in the backend).
   1. The Backstage makes a request to the keycloak to obtain the Token and Refresh Token via POST with content-type of type 'application/x-www-form-urlencoded' for URL `<keycloak.url.api.gateway>/auth/realms/$TENANT/protocol/openid-connect/token` passing in the request body `grant_type=authorization_code & redirect_uri=$REDIRECT_URI&client_id=<keycloak.public.client.id>&code_verifier=$CODE_VERIFIER&code=$AUTHORIZATION_CODE`.
   1. If the backstage flow works, that is, the Backstage is able to receive the Token and the Refresh Token, the Backstage redirects with the code 303 to `<gui.return.url>` and `state=$STATE`.
   1. The redirected URL is called in the Browser
   1. The page is requested for the GUI
   1. The GUI checks if there is a valid session, to do so, it makes a request via GET to `<app.base.url>/backstage/v1/auth/user-info`
   1. The backstage returns 200 with the user's data such as name, email and their permissions. At this point, Backstage makes 2 requests for the keycloak using the Token to obtain user information and permissions.
   1. The page is loaded with information from the logged in user.
   - Alternative to 2.4: if you are unable to obtain the Tokens
      - Deletes the redis session
      - The user is redirected to `gui.return.url` and a message is sent in QueryString saying that there was a problem, the GUI handles the message.
   - Alternative to 2.8: if you can't get data from the active session
      - The session is deleted and returns 401
3. An example Flow of obtaining data from dojot APIs
   1. The user already logged in makes a request to see the list of devices registered in his tenant, for some URL of the type `<app.base.url>/backstage/v1/devices`.
   1. Backstage receives the request that will make requests for some dojot API. **NOTE: It is checked if the current token is expired, if so, look for a new one with the refresh token. If it is unable return 401.**
   1. The backstage requests the data for the dojot APIs by passing the current access token via Kong (at this point kong checks if the Token can access the resource), to a url like `<app.internal.base.url>/devices`.
   1. The dojot API returns data to Backstage
   1. The backstage handles the data in some way, depending on the use case, and returns it to the GUI
   1. Some page using such data is loaded in the Browser
   - Alternative to 3.2: There is no active session
      - The session is deleted and returns 401
   - Alternative to 3.4: Kong returns that the token cannot access the resource/endpoint.
      - An error is returned

## GraphQL

Calls made through the GUI can be pre-processed and accessed via GraphQL.

To access the data via GraphQL it is necessary to have executed the authentication flow of OAuth using OpenID via the keycloak, that is, to have a cookie with a valid session id in the backstage.

To access GraphiQL, graphical interface in GraphQL interactive (it is also possible to see the documentation) enable `graphql.graphiql` and access the url it follows this pattern:

`http{s}://{host}:{port}/backstage/v1/graphql/`

For example, the address could be:

`<http://localhost:3000/backstage/v1/graphql/>`

The link to the static GraphQL documentation:

- [Latest GraphQL API documentation](https://dojot.github.io/backstage/graphql/latest)
- [Development GraphQL API documentation](https://dojot.github.io/backstage/graphql/development)

## Proxy

There is an proxy endpoint for internal calls to dojot via api gateway (kong). It adds `Authorization: 'Bearer TOKEN'` to the request header based on the current session.

To access the data via Proxy it is necessary to have executed the authentication flow of OAuth using OpenID via the keycloak, that is, to have a cookie with a valid session id in the backstage.

For example, calling `<app.base.url>/backstage/v1/proxy/device` internally will be called `<app.internal.base.url>/device`.

## Running the service

### Configurations

Before running the **Backstage** service within your environment, make sure you configure the
environment variables to match your needs.

You can select the configuration file via the `BS_CONFIG_FILE` variable. Its default value
is `production.conf`. Check the [config directory](./config) for the user configurations that are
available by default.

For more information about the usage of the configuration files and environment variables, check the
__ConfigManager__ module in our [Microservice SDK](https://github.com/dojot/dojot-microservice-sdk-js).
You can also check the [ConfigManager environment variables documentation](https://github.com/dojot/dojot-microservice-sdk-js/blob/master/lib/configManager/README.md#environment-variables) for more details.

In short, all the parameters in the next sections are mapped to environment variables that begin
with `BS_`. You can either use environment variables or configuration files to change their values.
You can also create new parameters via environment variables by following the fore mentioned
convention.

#### General Configurations

| Key | Purpose | Default Value | Valid Values | Environment variable
| --- | ------- | ------------- | ------------ | --------------------
| app.base.url| The URL where this service will be available  | <http://localhost:8000> | URL | BS_APP_BASE_URL
| app.internal.base.url| Internal access URL. In the case of dojot it is the URL to access the kong, our API Gateway, there is still an internal authorization check for access to the endpoint/resource if you are using the pepkong plugin. | <http://apigw:8000> | URL | BS_APP_INTERNAL_BASE_URL
| gui.return.url | GUI URL. URL available via browser to receive the response when the login process is complete. | <http://localhost:8000/return> | URL | BS_GUI_RETURN_URL
| gui.home.url | Initial GUI URL, URL available via browser. | <http://localhost:8000> | URL | BS_GUI_HOME_URL
| log.console.level | Console logger level | info | info, debug, error, warn | BS_LOG_CONSOLE_LEVEL
| log.file | Enables logging on file (location: /var/log/backstage-logs-%DATE%.log) | false | boolean  | BS_LOG_FILE
| log.file.level  | Log level to log on files | info | string  | BS_LOG_FILE_LEVEL
| log.verbose | Whether to enable logger verbosity or not | false | boolean | BS_LOG_VERBOSE
| express.trustproxy | Enables reverse proxy support  | true | boolean | BS_EXPRESS_TRUSTPROXY
| graphql.graphiql |  If true, presents GraphiQL when the GraphQL endpoint is loaded in a browser. We recommend that you set graphiql to true when your app is in development, because it's quite useful. You may or may not want it in production. | false | boolean | BS_GRAPHQL_GRAPHIQL

#### Server Configurations

| Key | Purpose | Default Value | Valid Values | Environment variable
| --- | ------- | ------------- | ------------ | --------------------
| server.host | Server address | 0.0.0.0 | string  | BS_SERVER_HOST
| server.port | Sever Port  | 3000 | integer  | BS_SERVER_PORT
| server.ca | File path to CAs.  | none | path  | BS_SERVER_CA
| server.cert | File path to  certificate.  | none | path | BS_SERVER_CERT
| server.key | File path to key certificate. | none | path |  BS_SERVER_KEY
| server.reject.unauthorized | If true, the server certificate is verified against the list of supplied CAs. | none | boolean | BS_SERVER_REJECT_UNAUTHORIZED
| server.request.cert | Whether to authenticate the remote peer by requesting a certificate. Clients always request a server certificate. | none | boolean | BS_SERVER_REQUEST_CERT

#### Keycloak Configurations

| Key | Purpose | Default Value | Valid Values | Environment variable
| --- | ------- | ------------- | ------------ | --------------------
| keycloak.url.api.gateway | URL for internal access via the Keycloak Gateway API | <http://apigw:8000/auth> | URL  | BS_KEYCLOAK_URL_API_GATEWAY
| keycloak.url.external | URL for external access | <http://localhost:8000/auth> | URL  | BS_KEYCLOAK_URL_EXTERNAL
| keycloak.healthcheck.ms | Specifies how often it is to check if it is possible to communicate with the keycloak in milliseconds. | 30000 | number (ms)  | BS_KEYCLOAK_HEALTHCHECK_MS
| keycloak.public.client.id | Public Client ID registered in the Keycloak that is used in the plugin process. | gui | string  | BS_KEYCLOAK_PUBLIC_CLIENT_ID
| keycloak.code.challenge.method | How is the code_challenge is hashed. S256=SHA-256 | S256 | string | BS_CODE_CHALLENGE_METHOD
| keycloak.secure |  If you want to verify the SSL Certs | false | boolean  | BS_KEYCLOAK_SECURE
| keycloak.ssl.ca | File path to CAs. | none | path  | BS_KEYCLOAK_CLIENT_TLS_CA
| keycloak.ssl.key | File path to key certificate. | none | path  | BS_KEYCLOAK_SSL_KEY
| keycloak.ssl.cert | File path to  certificate. | none | path  | BS_KEYCLOAK_SSL_CERT
| keycloak.ssl.request.cert |  Whether to authenticate the remote peer by requesting a certificate. Clients always request a server certificate. | none | boolean | BS_KEYCLOAK_SSL_REQUEST_CERT
| keycloak.ssl.reject.unauthorized |   If true, the server certificate is verified against the list of supplied CAs.  | none | boolean |  BS_KEYCLOAK_SSL_REJECT_UNAUTHORIZED

#### Session Configurations

| Key | Purpose | Default Value | Valid Values | Environment variable
| --- | ------- | ------------- | ------------ | --------------------
| session.secret | This is the secret used to sign the session ID cookie.  **NOTE: Should be unique for each environment and always configured** | none | string  | BS_SESSION_SECRET
| session.cookie.name | The name of the session ID cookie to set in the response (and read from in the request) | dojot-backstage-cookie | string  | BS_SESSION_COOKIE_NAME
| session.cookie.https | True is a recommended option. However, it requires an https-enabled website, i.e., HTTPS is necessary for secure cookies. If secure is set, and you access your site over HTTP, the cookie will not be set. If you have your node.js behind a proxy and are using secure: true, you need to set "trust proxy" in express
 | true | boolean  | BS_SESSION_COOKIE_HTTPS
| session.cookie.path | Specifies the value for the Path Set-Cookie. By default, this is set to '/', which is the root path of the domain. | / | string  | BS_SESSION_COOKIE_PATH
| session.proxy  | Trust the reverse proxy when setting secure cookies (via the "X-Forwarded-Proto" header). |true | boolean  | BS_SESSION_PROXY
| session.domain | The domain where the cookie will be used.  Specifies the value for the Domain Set-Cookie attribute.  |localhost | string  | BS_SESSION_DOMAIN
| session.redis.max.login.return.time.sec |  Maximum time before the session expires when starting a login and being returned to the `auth/return` endpont.   | 120 | number (seconds) | BS_SESSION_REDIS_MAX_LOGIN_RETURN_TIME_SEC
| session.redis.max.life.time.sec |  Maximum lifetime of a session. |86400 | number (seconds) | BS_SESSION_REDIS_MAX_LIFE_TIME_SEC
| session.redis.max.idle.time.sec | Maximum time that a session can be idle. |1800 | number (seconds) [It will be the lowest value between it and the one configured in the keycloak in `SSO Session Idle` in the `Tokens` tab of the Realm settings or the values configured on the client in Advanced Settings.] | BS_SESSION_REDIS_MAX_IDLE_TIME_SEC
| session.redis.key.prefix.name.max.life  [It will be the lowest value between it and the one configured in the keycloak in `SSO Session Max` in the `Tokens` tab of the Realm settings or the values configured on the client in Advanced Settings.] | The prefix key in Redis to save session data with suffix session identifier.  Its TTL, lifetime, is `session.redis.max.life.time.sec` . |session: | string | BS_SESSION_REDIS_KEY_PREFIX_NAME_MAX_LIFE
| session.redis.key.prefix.name.max.idle | The prefix key in Redis to save session data with suffix session identifier. Data does not persist, it is used to control session inactivity. Its TTL, lifetime, is `session.redis.max.login.return.time.sec` at the beginning and then is restarted with the value `session.redis.max.idle.time.sec`.|session-idle: | string | BS_SESSION_REDIS_KEY_PREFIX_NAME_MAX_IDLE

#### Redis Configurations

| Key | Purpose | Default Value | Valid Values | Environment variable
| --- | ------- | ------------- | ------------ | --------------------
| redis.client.host | Hostname of the Redis server | backstage-redis | string  | BS_REDIS_CLIENT_HOST
| redis.client.port | Port of the Redis server | 6379 | integer  | BS_REDIS_CLIENT_PORT
| redis.client.db | Database to be used in redis | 0 | integer  | BS_REDIS_CLIENT_DB
| redis.client.connect_timeout | The maximum time for reconnection attempts.  | 3600000 | number (ms)  | BS_REDIS_CLIENT_CONNECT__TIMEOUT
| redis.client.tls.ca | File path to  CAs. | none | path  | BS_REDIS_CLIENT_TLS_CA
| redis.client.tls.key | File path to key certificate. | none | path  | BS_REDIS_CLIENT_TLS_KEY
| redis.client.tls.cert | File path to  certificate. | none | path  | BS_REDIS_CLIENT_TLS_CERT
| redis.client.tls.request.cert |  Whether to authenticate the remote peer by requesting a certificate. Clients always request a server certificate. I | none | boolean | BS_REDIS_CLIENT_TLS_REQUEST_CERT
| redis.client.tls.reject.unauthorized |   If true, the server certificate is verified against the list of supplied CAs. | none | boolean | BS_REDIS_CLIENT_TLS_REJECT_UNAUTHORIZED
| redis.reconnect.after.ms | Interval between connection attempts. | 5000 | number (ms) | BS_REDIS_RECONNECT_AFTER_MS
redis.healthcheck.ms | Specifies how often it is to check if it is possible to communicate with the redis in milliseconds. | 30000 | integer | BS_REDIS_HEALTHCHECK_MS
redis.healthcheck.timeout.ms | the timeout to wait if the service can verify if it is health, if the timeout occurs the service is considered unhealthy. (ms) | 5000 | integer | BS_REDIS_HEALTHCHECK_TIMEOUT_MS

#### Postgres Configurations

| Key | Purpose | Default Value | Valid Values | Environment variable
| --- | ------- | ------------- | ------------ | --------------------
| postgres.client.host | Hostname of the Postgres  server  | postgres  | string  | BS_POSTGRES_CLIENT_HOST
| postgres.client.port | Port of the Postgres server | 5432 | integer  | BS_POSTGRES_CLIENT_PORT
| postgres.client.database | Database to be used | backstage | string  | BS_POSTGRES_CLIENT_DATABASE
| postgres.client.user | User with access to database | backstage | string  | BS_POSTGRES_CLIENT_USER
| postgres.client.password | User password | backstage | string  | BS_POSTGRES_CLIENT_PASSWORD
| postgres.client.ssl.ca | File path to CAs. | none | path  | BS_POSTGRES_CLIENT_SSL_CA
| postgres.client.ssl.key | File path to key certificate. | none | path  | BS_POSTGRES_CLIENT_SSL_KEY
| postgres.client.ssl.cert | File path to  certificate. | none | path  | BS_POSTGRES_CLIENT_SSL_CERT
| postgres.client.ssl.request.cert |  Whether to authenticate the remote peer by requesting a certificate. Clients always request a server certificate.  | none | boolean | BS_POSTGRES_CLIENT_SSL_REQUEST_CERT
| postgres.client.ssl.reject.unauthorized |   If true, the server certificate is verified against the list of supplied CAs.  | none | boolean |  BS_POSTGRES_CLIENT_SSL_REJECT_UNAUTHORIZED
| postgres.healthcheck.ms |  Specifies how often it is to check if it is possible to communicate with the postgres in milliseconds. | 30000 | number (ms)  | BS_POSTGRES_HEALTHCHECK_MS

#### Proxy Configurations

| Key | Purpose | Default Value | Valid Values | Environment variable
| --- | ------- | ------------- | ------------ | --------------------
| proxy.target | Target host to proxy to. (protocol + host) | <http://apigw:8000> | url  | BS_PROXY_TARGET
| proxy.log.level | Log level | info |  ['debug', 'info', 'warn', 'error', 'silent']  | BS_PROXY_LOG_LEVEL
| proxy.secure |  If you want to verify the SSL Certs | false | boolean  | BS_PROXY_SECURE
| proxy.ssl.ca | File path to CAs. | none | path  | BS_PROXY_CLIENT_TLS_CA
| proxy.ssl.key | File path to key certificate. | none | path  | BS_PROXY_SSL_KEY
| proxy.ssl.cert | File path to  certificate. | none | path  | BS_PROXY_SSL_CERT
| proxy.ssl.request.cert |  Whether to authenticate the remote peer by requesting a certificate. Clients always request a server certificate. | none | boolean | BS_PROXY_SSL_REQUEST_CERT
| proxy.ssl.reject.unauthorized |   If true, the server certificate is verified against the list of supplied CAs.  | none | boolean |  BS_PROXY_SSL_REJECT_UNAUTHORIZED

#### Service State Manager

These parameters are passed directly to the SDK ServiceStateManager. Check the
[official repository](https://github.com/dojot/dojot-microservice-sdk-js) for more info on the
values.

| Key | Default Value | Valid Values | Environment variable
| --- | ------------- | ------------ | --------------------
| lightship.detect.kubernetes | false | boolean | BS_LIGHTSHIP_DETECT_KUBERNETES
| lightship.graceful.shutdown.timeout | 120000 | number (milliseconds) | BS_LIGHTSHIP_GRACEFUL_SHUTDOWN_TIMEOUT
| lightship.port | 9000 | number | BS_LIGHTSHIP_PORT
| lightship.shutdown.delay | 5000 | number (milliseconds) | BS_SHUTDOWN_DELAY
| lightship.shutdown.handler.timeout | 20000 | number (milliseconds) | BS_SHUTDOWN_HANDLER_TIMEOUT

### How to run

Beforehand, you need an already running dojot instance in your machine. Check out the
[dojot documentation](https://dojotdocs.readthedocs.io)
for more information on installation methods.

Generate the Docker image:

```shell
docker build -t <username>/backstage:<tag> -f  .
```

Then an image tagged as `<username>/backstage:<tag>` will be made available. You can send it to
your DockerHub registry to made it available for non-local dojot installations:

```shell
docker push <username>/backstage:<tag>
```

__NOTE THAT__ you can use the official image provided by dojot in its  [DockerHub page](https://hub.docker.com/r/dojot/backstage).

## Documentation

Check the documentation for more information:

- [Latest Backstage Retriever API documentation](https://dojot.github.io/backstage/api/doc.html)
- [Development Backstage Retriever API documentation](https://dojot.github.io/backstage/api/doc.html?version=development)
- [Latest GraphQL API documentation](https://dojot.github.io/backstage/graphql/latest)
- [Development GraphQL API documentation](https://dojot.github.io/backstage/graphql/development)
- [Latest dojot platform documentation](https://dojotdocs.readthedocs.io/en/latest)

## Issues and help

If you found a problem or need help, leave an issue in the main
[dojot repository](https://github.com/dojot/dojot) and we will help you!

## Example

Check the [example](./example) directory for more details.

## License

The Backstage source code is released under Apache License 2.0.

Check [NOTICE](./NOTICE.md) and [LICENSE](./LICENSE) files for more information.
