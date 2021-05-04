const QUERY_CREATE_TABLE_USER_CONFIG = 'CREATE TABLE IF NOT EXISTS user_config ( '
  + 'tenant varchar(255) NOT NULL, '
  + 'username varchar(255) NOT NULL,'
  + 'configuration json NOT NULL, '
  + 'last_update timestamp WITH time zone DEFAULT CURRENT_TIMESTAMP, '
  + 'CONSTRAINT unique_user PRIMARY KEY (tenant, username) '
  + ');';


module.exports = { QUERY_CREATE_TABLE_USER_CONFIG };
