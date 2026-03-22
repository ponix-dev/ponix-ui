/**
 * Mock JWT token with a far-future expiration to prevent refresh timers during tests.
 * Payload: { sub: "user-1", email: "test@example.com", exp: 9999999999 }
 */
function makeJwt(payload: object): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }))
  const body = btoa(JSON.stringify(payload))
  const signature = btoa("mock-signature")
  return `${header}.${body}.${signature}`
}

export const TEST_USER = {
  id: "user-1",
  email: "test@example.com",
  name: "Test User",
}

export const TEST_TOKEN = makeJwt({
  sub: TEST_USER.id,
  email: TEST_USER.email,
  exp: 9999999999,
})

export const TEST_ORG = {
  id: "org-1",
  name: "Test Org",
}

export const TEST_GATEWAY = {
  gatewayId: "gw-1",
  organizationId: TEST_ORG.id,
  name: "Test Gateway",
  status: 1,
  type: 1,
  emqxConfig: { brokerUrl: "mqtt://broker:1883" },
}

export const TEST_WORKSPACE = {
  id: "ws-1",
  organizationId: TEST_ORG.id,
  name: "Test Workspace",
  status: 1,
}

export const TEST_DEFINITION = {
  id: "def-1",
  organizationId: TEST_ORG.id,
  name: "Test Definition",
  contracts: [
    {
      matchExpression: "true",
      transformExpression: "payload",
      jsonSchema: "{}",
    },
  ],
}

export const TEST_DATA_STREAM = {
  dataStreamId: "ds-1",
  organizationId: TEST_ORG.id,
  name: "Test Stream",
  definitionId: TEST_DEFINITION.id,
  workspaceId: TEST_WORKSPACE.id,
  gatewayId: TEST_GATEWAY.gatewayId,
}

export const TEST_DOCUMENT = {
  documentId: "doc-1",
  organizationId: TEST_ORG.id,
  name: "Test Document",
  createdAt: "2024-03-09T00:00:00Z",
  updatedAt: "2024-03-09T00:00:00Z",
}

// ── Response factories ──

export const responses = {
  // Auth
  login: () => ({ token: TEST_TOKEN }),
  refresh: () => ({ accessToken: TEST_TOKEN }),
  getUser: () => ({ user: TEST_USER }),
  logout: () => ({}),
  register: () => ({ user: TEST_USER }),

  // Organizations
  userOrganizations: (orgs = [TEST_ORG]) => ({ organizations: orgs }),
  createOrganization: (id = "org-new", name = "New Org") => ({
    organizationId: id,
  }),
  getOrganization: (org = TEST_ORG) => ({ organization: org }),

  // Gateways
  listGateways: (gateways = [TEST_GATEWAY]) => ({ gateways }),
  createGateway: (gateway = TEST_GATEWAY) => ({ gateway }),
  getGateway: (gateway = TEST_GATEWAY) => ({ gateway }),

  // Workspaces
  listWorkspaces: (workspaces = [TEST_WORKSPACE]) => ({ workspaces }),
  createWorkspace: (workspace = TEST_WORKSPACE) => ({ workspace }),
  getWorkspace: (workspace = TEST_WORKSPACE) => ({ workspace }),

  // Definitions
  listDefinitions: (definitions = [TEST_DEFINITION]) => ({
    dataStreamDefinitions: definitions,
  }),
  createDefinition: (definition = TEST_DEFINITION) => ({
    dataStreamDefinition: definition,
  }),
  getDefinition: (definition = TEST_DEFINITION) => ({
    dataStreamDefinition: definition,
  }),

  // Data Streams
  listWorkspaceDataStreams: (dataStreams = [TEST_DATA_STREAM]) => ({
    dataStreams,
  }),
  listGatewayDataStreams: (dataStreams = [TEST_DATA_STREAM]) => ({
    dataStreams,
  }),
  createDataStream: (dataStream = TEST_DATA_STREAM) => ({ dataStream }),
  getDataStream: (dataStream = TEST_DATA_STREAM) => ({ dataStream }),

  // Documents
  listWorkspaceDocuments: (documents = [TEST_DOCUMENT]) => ({ documents }),
  listDefinitionDocuments: (documents = [TEST_DOCUMENT]) => ({ documents }),
  listDataStreamDocuments: (documents = [TEST_DOCUMENT]) => ({ documents }),
  createWorkspaceDocument: (document = TEST_DOCUMENT) => ({ document }),
  createDefinitionDocument: (document = TEST_DOCUMENT) => ({ document }),
  createDataStreamDocument: (document = TEST_DOCUMENT) => ({ document }),
  getDocument: (document = TEST_DOCUMENT) => ({ document }),
}

// ── Service paths ──

export const services = {
  // Auth
  login: "user.v1.UserService/Login",
  refresh: "user.v1.UserService/Refresh",
  getUser: "user.v1.UserService/GetUser",
  logout: "user.v1.UserService/Logout",
  register: "user.v1.UserService/RegisterUser",

  // Organizations
  userOrganizations: "organization.v1.OrganizationService/UserOrganizations",
  createOrganization: "organization.v1.OrganizationService/CreateOrganization",
  getOrganization: "organization.v1.OrganizationService/GetOrganization",

  // Gateways
  listGateways: "gateway.v1.GatewayService/ListGateways",
  createGateway: "gateway.v1.GatewayService/CreateGateway",
  getGateway: "gateway.v1.GatewayService/GetGateway",

  // Workspaces
  listWorkspaces: "workspace.v1.WorkspaceService/ListWorkspaces",
  createWorkspace: "workspace.v1.WorkspaceService/CreateWorkspace",
  getWorkspace: "workspace.v1.WorkspaceService/GetWorkspace",

  // Definitions
  listDefinitions:
    "data_stream.v1.DataStreamDefinitionService/ListDataStreamDefinitions",
  createDefinition:
    "data_stream.v1.DataStreamDefinitionService/CreateDataStreamDefinition",
  getDefinition:
    "data_stream.v1.DataStreamDefinitionService/GetDataStreamDefinition",

  // Data Streams
  getWorkspaceDataStreams: "data_stream.v1.DataStreamService/GetWorkspaceDataStreams",
  getGatewayDataStreams: "data_stream.v1.DataStreamService/GetGatewayDataStreams",
  createDataStream: "data_stream.v1.DataStreamService/CreateDataStream",
  getDataStream: "data_stream.v1.DataStreamService/GetDataStream",

  // Documents
  listWorkspaceDocuments: "document.v1.DocumentService/ListWorkspaceDocuments",
  listDefinitionDocuments: "document.v1.DocumentService/ListDefinitionDocuments",
  listDataStreamDocuments: "document.v1.DocumentService/ListDataStreamDocuments",
  createWorkspaceDocument: "document.v1.DocumentService/CreateWorkspaceDocument",
  createDefinitionDocument: "document.v1.DocumentService/CreateDefinitionDocument",
  createDataStreamDocument: "document.v1.DocumentService/CreateDataStreamDocument",
  getDocument: "document.v1.DocumentService/GetDocument",
} as const

// ── ConnectRPC error helpers ──

export function connectError(code: string, message: string) {
  return { code, message }
}
