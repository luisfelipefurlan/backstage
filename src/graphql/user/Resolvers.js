const LOG = require('../../utils/Log');
const connection = require('../../db');

const Resolvers = {
    Query: {
        async getConfig(root, params) {
            const query = {
                text: "SELECT configuration FROM user_config WHERE username=$1 AND tenant=$2;",
                values: [params.user, params.tenant]
            };

            try {
                const result = await connection.query(query);
                if (result.rowCount) {
                    return (JSON.stringify(result.rows[0].configuration));
                }
                else {
                    throw `Could not retrieve configuration from user ${params.user} in tenant ${params.tenant}`;
                }
            }
            catch (error) {
                LOG.error(error);
                return "Could not complete operation";
            }
        }
    },

    Mutation: {
        async updateConfig(root, params) {
            try {
                const date = new Date().toLocaleString();
                let query = {
                    text: "SELECT * FROM user_config WHERE username=$1 AND tenant=$2;",
                    values: [params.user, params.tenant]
                };

                let result = await connection.query(query);

                if (result.rowCount) {
                    query = {
                        text: "UPDATE user_config SET configuration=$3, last_update=$4 WHERE username=$1 AND tenant=$2;",
                        values: [params.user, params.tenant, JSON.parse(params.config), date]
                    };

                    result = await connection.query(query);
                    if (result.rowCount) {
                        return "Updated user's dashboard configuration";
                    }
                    else {
                        throw 'Could not update database';
                    }
                } else {
                    query = {
                        text: "INSERT INTO user_config VALUES ($1, $2, $3, $4);",
                        values: [params.tenant, params.user, JSON.parse(params.config), date]
                    };
                    result = await connection.query(query);
                    if (result.rowCount) {
                        return "Added configuration to database";
                    }
                    else {
                        throw 'Failed to inserto into database';
                    }
                }
            } catch (error) {
                LOG.error(error);
                return "Could not complete operation";
            }
        },
    }
};

module.exports = Resolvers;