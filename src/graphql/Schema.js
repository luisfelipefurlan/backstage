const { makeExecutableSchema } = require('graphql-tools');
const { merge } = require('lodash');
const commonTypeDefs = require('./common/TypeDefs');
const templateTypeDefs = require('./template/TypeDefs');
const templateResolvers = require('./template/Resolvers');
const deviceTypeDefs = require('./device/TypeDefs');
const deviceResolvers = require('./device/Resolvers');


const query = [`
  type Query {
      #Get a template by Id
      template(id: Int!): Template
      #Checks if templates has Image Firmware and return a array with objects key-value, where key is a id template and value is a boolean.
      #The value is true if the template has image firmware.
      templatesHasImageFirmware(templatesId: [Int]!): [MapStringToString]
      #Returns a list of devices that can be divided in pages, and the information about how many pages there are in total, along with which page is being shown
      getDevices(page: PageInput, filter: FilterDeviceInput): DeviceListPage
      #Finds device information by id
      getDeviceById(deviceId: String!): Device
      #Returns historical data about devices' attributes chosen in the input
      getDeviceHistory(filter: HistoryInput!): [History]
    }
`];

// Put schema together into one array of schema strings
// and one map of resolvers, like makeExecutableSchema expects
const typeDefs = [...query, ...templateTypeDefs, ...commonTypeDefs, ...deviceTypeDefs];
const resolvers = merge(templateResolvers, deviceResolvers);

const executableSchema = makeExecutableSchema({ typeDefs, resolvers });

module.exports = executableSchema;
module.exports.typeDefs = typeDefs;
