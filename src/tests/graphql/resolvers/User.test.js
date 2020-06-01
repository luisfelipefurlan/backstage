const Resolver = require('../../../graphql/user/Resolvers');
const { Pool } = require('pg');

jest.mock('pg', () => {
  const testPool = {
    connect: jest.fn(),
    query: jest.fn(),
    end: jest.fn(),
  };
  return { Pool: jest.fn(() => testPool) };
});
beforeEach(() => {
  connection = new Pool();
});
afterEach(() => {
  jest.clearAllMocks();
});

it('should return a configuration string', () => {
  const params = { user: "admin", tenant: "admin" };
  const config = {config:'something'};

  connection.query.mockImplementation(() => Promise.resolve({ "command": "SELECT", "rowCount": 1, "oid": null, "rows": [{"configuration":config}], "fields": [{ "name": "configuration", "tableID": 24576, "columnID": 3, "dataTypeID": 114, "dataTypeSize": -1, "dataTypeModifier": -1, "format": "text" }], "_parsers": [null], "RowCtor": null, "rowAsArray": false }));

  return Resolver.Query.getConfig({}, params).then((output) => {
    expect(output).toEqual(JSON.stringify(config));
  });
});

it('should return an update message', () => {
  const params = { user: 'admin', tenant: 'admin', config: '{"config":"newconfig"}' };

  connection.query.mockImplementation(() => Promise.resolve({"command":"SELECT","rowCount":1,"oid":null,"rows":[],"fields":[],"_parsers":[],"RowCtor":null,"rowAsArray":false}));
  connection.query.mockImplementation(() => Promise.resolve({"command":"UPDATE","rowCount":1,"oid":null,"rows":[],"fields":[],"_parsers":[],"RowCtor":null,"rowAsArray":false}));

  return Resolver.Mutation.updateConfig({}, params).then((output) => {
    expect(output).toEqual("Updated user's dashboard configuration");
  });
});

it('should return and inserted message', () => {
  const params = { user: 'sims', tenant: 'admin', config: '{"config":"simsconfig"}' };

  connection.query.mockReturnValueOnce({ "command": "SELECT", "rowCount": 0 })
    .mockReturnValueOnce({ "command": "INSERT", "rowCount": 1, "oid": null, "rows": [], "fields": [], "_parsers": [], "RowCtor": null, "rowAsArray": false });

  return Resolver.Mutation.updateConfig({}, params).then((output) => {
    expect(output).toEqual("Added configuration to database");
  });
});

it('should return an error on getConfig', () => {
  const params = { user: "admin", tenant: "admin" };

  connection.query.mockImplementation(() => Promise.resolve({"command": "SELECT", "rowCount": 0}));

  return Resolver.Query.getConfig({}, params).then((output) => {
    expect(output).toEqual('Could not complete operation');
  });
});

it('should return an error on updateConfig', () => {
  const params = { user: 'sims', tenant: 'admin', config: '{"config":"simsconfig"}' };

  connection.query.mockResolvedValue('default value')
    .mockResolvedValueOnce({ "command": "SELECT", "rowCount": 0 })
    .mockResolvedValueOnce({ "command": "INSERT", "rowCount": 0 });

  return Resolver.Mutation.updateConfig({}, params).then((output) => {
    expect(output).toEqual("Could not complete operation");
  });
});