import { createClient } from "@connectrpc/connect"
import { transport } from "./transport"

import { OrganizationService } from "@buf/ponix_ponix.bufbuild_es/organization/v1/organization_pb"
import { GatewayService } from "@buf/ponix_ponix.bufbuild_es/gateway/v1/gateway_pb"
import { DataStreamService } from "@buf/ponix_ponix.bufbuild_es/data_stream/v1/data_stream_pb"
import { DataStreamDefinitionService } from "@buf/ponix_ponix.bufbuild_es/data_stream/v1/data_stream_definition_pb"
import { UserService } from "@buf/ponix_ponix.bufbuild_es/user/v1/user_pb"
import { WorkspaceService } from "@buf/ponix_ponix.bufbuild_es/workspace/v1/workspace_pb"
import { DocumentService } from "@buf/ponix_ponix.bufbuild_es/document/v1/document_pb"

export const organizationClient = createClient(OrganizationService, transport)
export const gatewayClient = createClient(GatewayService, transport)
export const dataStreamClient = createClient(DataStreamService, transport)
export const dataStreamDefinitionClient = createClient(DataStreamDefinitionService, transport)
export const userClient = createClient(UserService, transport)
export const workspaceClient = createClient(WorkspaceService, transport)
export const documentClient = createClient(DocumentService, transport)

// Re-export types for convenience
export type {
  Organization,
  CreateOrganizationRequest,
  CreateOrganizationResponse,
  GetOrganizationRequest,
  GetOrganizationResponse,
  DeleteOrganizationRequest,
  DeleteOrganizationResponse,
} from "@buf/ponix_ponix.bufbuild_es/organization/v1/organization_pb"


export type {
  Gateway,
  EMQXGatewayConfig,
  CreateGatewayRequest,
  CreateGatewayResponse,
  GetGatewayRequest,
  GetGatewayResponse,
  ListGatewaysRequest,
  ListGatewaysResponse,
  UpdateGatewayRequest,
  UpdateGatewayResponse,
  DeleteGatewayRequest,
  DeleteGatewayResponse,
} from "@buf/ponix_ponix.bufbuild_es/gateway/v1/gateway_pb"

export {
  GatewayType,
} from "@buf/ponix_ponix.bufbuild_es/gateway/v1/gateway_pb"

export type {
  DataStream,
  CreateDataStreamRequest,
  CreateDataStreamResponse,
  GetDataStreamRequest,
  GetDataStreamResponse,
} from "@buf/ponix_ponix.bufbuild_es/data_stream/v1/data_stream_pb"

export type {
  User,
  RegisterUserRequest,
  RegisterUserResponse,
  LoginRequest,
  LoginResponse,
  RefreshRequest,
  RefreshResponse,
  LogoutRequest,
  LogoutResponse,
  GetUserRequest,
  GetUserResponse,
} from "@buf/ponix_ponix.bufbuild_es/user/v1/user_pb"

export type {
  UserOrganizationsRequest,
  UserOrganizationsResponse,
} from "@buf/ponix_ponix.bufbuild_es/organization/v1/organization_pb"

export type {
  Workspace,
  CreateWorkspaceRequest,
  CreateWorkspaceResponse,
  GetWorkspaceRequest,
  GetWorkspaceResponse,
  UpdateWorkspaceRequest,
  UpdateWorkspaceResponse,
  DeleteWorkspaceRequest,
  DeleteWorkspaceResponse,
  ListWorkspacesRequest,
  ListWorkspacesResponse,
} from "@buf/ponix_ponix.bufbuild_es/workspace/v1/workspace_pb"


export type {
  GetWorkspaceDataStreamsRequest,
  GetWorkspaceDataStreamsResponse,
} from "@buf/ponix_ponix.bufbuild_es/data_stream/v1/data_stream_pb"

export type {
  DataStreamDefinition,
  CreateDataStreamDefinitionRequest,
  CreateDataStreamDefinitionResponse,
  ListDataStreamDefinitionsRequest,
  ListDataStreamDefinitionsResponse,
} from "@buf/ponix_ponix.bufbuild_es/data_stream/v1/data_stream_definition_pb"

export type {
  Document,
  GetDocumentRequest,
  GetDocumentResponse,
  DeleteDocumentRequest,
  DeleteDocumentResponse,
} from "@buf/ponix_ponix.bufbuild_es/document/v1/document_pb"
