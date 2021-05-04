// generate `schemaDoc.graphql` file based on the schemas used in the backstage service
const { writeFileSync } = require('fs');
const { typeDefs } = require('../app/graphql/Schema');

writeFileSync(`${__dirname}/schemaDoc.graphql`, (typeDefs));
