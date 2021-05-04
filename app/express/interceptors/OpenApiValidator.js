
const OpenApiValidator = require('express-openapi-validator');
const path = require('path');

const openApiFilePath = path.join(__dirname, '../../../api/v1.yml');
/**
 * Middleware to validate request/response based in openApi 3.0
 */
module.exports = () => ({
  name: 'validator-interceptor',
  middleware: OpenApiValidator.middleware({
    apiSpec: openApiFilePath,
    validateRequests: true,
    validateResponses: false,
  }),
});
