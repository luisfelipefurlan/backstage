const LOG = require('../../utils/Log');
const connection = require('../../db');

const Resolvers = {
    Query: {
        async getConfig(root, params) {
            const query = {
                text: "SELECT configuration FROM user_config WHERE username=$1 AND tenant=$2;",
                values: [params.user, params.tenant]
            };
            console.log(`Pool infos: ${JSON.stringify(connection)}`);
            console.log(`A query é essa: ${JSON.stringify(query)}`);

            try {
                const client = await connection.connect();
                const result = await client.query(query);
                console.log(`Resultado: ${JSON.stringify(result)}`);
                return JSON.stringify(result.rows[0].configuration);
            }
            catch (error) {
                LOG.error(error);
            }
            finally {
                connection.end();
            }
        }
    },

    Mutation: {
        async updateConfig(root, params) {
            try {
                //connection.connect();
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
                    return "Updated user's dashboard configuration.";

                } else {
                    query = {
                        text: "INSERT INTO user_config VALUES ($1, $2, $3, $4);",
                        values: [params.user, params.tenant, JSON.parse(params.config), date]
                    };
                    result = await connection.query(query);
                    return "Added configuration to database";   
                }
            } catch (error) {
                LOG.error(error);
                return "Could not complete operation";
            }
            finally{
                connection.end();
            }
        },
    }
};

module.exports = Resolvers;