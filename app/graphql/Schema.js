const { makeExecutableSchema } = require('graphql-tools');
const { merge } = require('lodash');
const templateResolvers = require('./template/Resolvers');
const deviceResolvers = require('./device/Resolvers');
const userResolvers = require('./user/Resolvers');
const typeDefs = require('./TypeDefs');

const resolvers = merge(
  templateResolvers,
  deviceResolvers,
  userResolvers,
);

const executableSchema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = executableSchema;
