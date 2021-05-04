/* eslint-disable no-param-reassign */
const {
  Logger,
} = require('@dojot/microservice-sdk');

const Postgres = require('../../postgres');
// const Keycloak = require('../../keycloak');

const logger = new Logger('backstage:graphql/user/Resolvers');

const Resolvers = {
  Query: {
    async getConfig(root, params) {
      let query = {};
      if (params.user) {
        if (params.user === '**generic_user**') {
          throw new Error('Cannot use this username');
        }
        query = {
          text: 'SELECT configuration FROM user_config WHERE username=$1 AND tenant=$2;',
          values: [params.user, params.tenant],
        };
      } else {
        query = {
          text: 'SELECT configuration FROM user_config WHERE username=$1 AND tenant=$2;',
          values: ['**generic_user**', params.tenant],
        };
      }

      try {
        const result = await Postgres.query(query);
        if (result.rowCount) {
          return (JSON.stringify(result.rows[0].configuration));
        }

        throw new Error(`Could not retrieve configuration from user ${params.user} in tenant ${params.tenant}`);
      } catch (error) {
        logger.error(error);
        return 'Could not complete operation';
      }
    },
  },

  Mutation: {
    async updateConfig(root, params) {
      const genUser = '**generic_user**';
      try {
        if (params.config === null) {
          throw new Error('Dashboard configuration cannot be null');
        }
        let query = {};
        if (params.user) {
          if (params.user === genUser) {
            throw new Error('Cannot use this username');
          }
          query = {
            text: 'SELECT * FROM user_config WHERE username=$1 AND tenant=$2;',
            values: [params.user, params.tenant],
          };
        } else {
          query = {
            text: 'SELECT * FROM user_config WHERE username=$1 AND tenant=$2;',
            values: [genUser, params.tenant],
          };
          params.user = genUser;
        }

        const date = new Date().toLocaleString();
        let result = await Postgres.query(query);


        if (result.rowCount) {
          query = {
            text: 'UPDATE user_config SET configuration=$3, last_update=$4 WHERE username=$1 AND tenant=$2;',
            values: [params.user, params.tenant, JSON.parse(params.config), date],
          };
          result = await Postgres.query(query);
          if (result.rowCount) {
            return "Updated user's dashboard configuration";
          }

          throw new Error('Could not update database');
        } else {
          query = {
            text: 'INSERT INTO user_config VALUES ($1, $2, $3, $4);',
            values: [params.tenant, params.user, JSON.parse(params.config), date],
          };
          result = await Postgres.query(query);
          if (result.rowCount) {
            return 'Added configuration to database';
          }

          throw new Error('Failed to insert into database');
        }
      } catch (error) {
        logger.error(error);
        return 'Could not complete operation';
      }
    },
  },
};

module.exports = Resolvers;
