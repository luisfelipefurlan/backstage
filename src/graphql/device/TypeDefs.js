const TypeDefs = [`
#Necessary informations about device#
type Device {
    id: String!
    label: String!
    attrs: [Attr]
 }
 #Value types used by the platform#
 enum ValueType {
    NUMBER
    STRING
    BOOLEAN
    GEO
    UNDEFINED
 }
 #Necessary data about and attribute of a device#
 type Attr {
    label: String!
    valueType: ValueType!
 }

#A paginated list of Devices.#
 type DeviceListPage {
    totalPages: Int!
    currentPage: Int!
    devices: [Device]
 }
#Determines which page to show and how many items#
 input PageInput {
    #set the page number to be accessed (default 20) #
    number: Int
    #set the number of elements to be shown in a page (default 1) #
    size: Int
 }

 #Return only devices that are named accordingly (prefix or suffix match)#
 input FilterDeviceInput {
    label: String
 }
 #Parameters to query historical device data#
 input HistoryInput {
    #list of devices which attributes will be retrieved#
    devices: [HistoryDeviceInput]!
    dateFrom: String
    dateTo: String
    #operationType corresponds to 0 (LastN), 1 (minutes), 2 (hours), 3 (days), 4 (months)
    operationType: Int
    #lastN will be used to obtain the values of minutes, hours, days and months when the operationType is non-zero#
    lastN: Int
 }

 #Parameters to identify from which device and which attributes to retrieve historical data from#
 input HistoryDeviceInput{
    #device selected#
    deviceID: String!
    #attributes which readings are to be retrieved#
    attrs: [String]
 }
 #Historical reading from an attribute#
 type HistoryAttr {
    label: String!
    valueType: ValueType!
    value: String!
    timestamp: String!
 }
 #Historical reading from device#
 type History{
    deviceID: String!
    label: String!
    attrs: [HistoryAttr]
 }
`];

module.exports = TypeDefs;
