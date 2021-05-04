const {
  ConfigManager: { getConfig },
} = require('@dojot/microservice-sdk');

const {
  app: configApp,
} = getConfig('BS');

class AxiosUtils {
  static get GET() {
    return 'GET';
  }

  static get POST() {
    return 'POST';
  }

  static get DELETE() {
    return 'DELETE';
  }

  static optionsAxios(method, url, token, baseUrl = configApp['internal.base.url']) {
    return {
      method,
      headers: {
        'content-type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      url: `${baseUrl}${url}`,
    };
  }

  static handleErrorAxios(error) {
    if (error.response && error.response.status && error.response.data) {
      throw new Error(`${error.response.status}: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

module.exports = AxiosUtils;
