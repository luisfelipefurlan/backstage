const { graphqlHTTP } = require('express-graphql');
const {
  ConfigManager: { getConfig },
} = require('@dojot/microservice-sdk');

const rootSchema = require('../../graphql/Schema');

const { graphql: configGraphql } = getConfig('BS');

/**
 * Middleware graphql
 * @param {string} mountPoint
 * @returns
 */
module.exports = ({ mountPoint }) => ({
  name: 'graphql',
  path: `${mountPoint}/graphql`,
  middleware: [
    (req, res, next) => {
      // inject token obtained from the session
      req.token = req.session.accessToken;
      return next();
    },
    graphqlHTTP({
      schema: rootSchema,
      graphiql: configGraphql ? { headerEditorEnabled: true } : false,
      customFormatErrorFn: (error) => ({
        message: error.message,
        locations: error.locations,
      }),
    }),
  ],
});
