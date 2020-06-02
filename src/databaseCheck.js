const connection = require('./db');
const LOG = require('./utils/Log');
const config = require('./config');

//check if table exists
async function checkTable(table_name){
    let query = {
        text: "SELECT * FROM information_schema.tables WHERE table_name=$1;",
        values: [table_name]
    };
    try{
        const client = await connection.connect();
        let result = await client.query(query);
        if (!result.rowCount){
            LOG.info('Table "user_config" not found.');
            query = {
                text: "CREATE TABLE user_config ( \
                    tenant varchar(255) NOT NULL, \
                    username varchar(255) NOT NULL, \
                    configuration json NOT NULL, \
                    last_update timestamp WITH time zone DEFAULT CURRENT_TIMESTAMP, \
                    CONSTRAINT unique_user PRIMARY KEY (tenant, username) \
                 );"
            };
            result = await client.query(query);
        }
        else {
            LOG.info('Table user_config already exists');
        }
        return true;
    }catch (err){
        LOG.error(`Erro: ${JSON.stringify(err)}`);
        return false;
    }finally{
        connection.end();
        process.exit();
    }
}

checkTable(config.user_config_data_table);