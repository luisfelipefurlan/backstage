const TypeDefs = [`
  type Metadata {
     #Metadata ID
     id: Int
     #Metadata Label
     label: String
     #Meta Value
     static_value: String
     #Can be define by user. Like a unit
     type: String
     #Can be String, Integer, Float, Geo, etc.
     value_type: String
     #Timestamp of create date
     created: String
     #Timestamp of update date
     updated: String
  }

  type Attributes {
    #Attribute ID
     id: Int
     #Attribute Label
     label: String
     #List of Metadatas associate to Attribute
     metadata: [Metadata]
     #Value when type is Static
     static_value: String
     #Primary key of a template
     template_id: String
     #Can be static, dynamic, etc.
     type: String
     #Can be String, Integer, Float, Geo, etc.
     value_type: String
     #Timestamp of create date
     created: String
  }

  type Template {
    #Template ID
    id: Int,
    #Template Label
    label: String!
    #List of Attributes
    attrs: [Attributes]
    #List of Configuration Attributes
    config_attrs: [Attributes]
    #List of Data Attributes
    data_attrs: [Attributes]
    #List of Image Attributes (Firmware)
    img_attrs: [Attributes]
    #Timestamp of create date
    created: String
  }

   type TemplatesListPage {
    totalPages: Int!
    currentPage: Int!
    templates: [TemplateList]
 }

 type TemplateList {
    id: String!
    label: String!
    attrs: [Attr]
 }
`];

module.exports = TypeDefs;
