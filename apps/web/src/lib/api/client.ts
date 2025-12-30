import { createClient } from "@connectrpc/connect"
import { transport } from "./transport"

import { OrganizationService } from "@buf/ponix_ponix.bufbuild_es/organization/v1/organization_pb"
import { GatewayService } from "@buf/ponix_ponix.bufbuild_es/gateway/v1/gateway_pb"
import { EndDeviceService } from "@buf/ponix_ponix.bufbuild_es/end_device/v1/end_device_pb"
import { UserService } from "@buf/ponix_ponix.bufbuild_es/user/v1/user_pb"
import { WorkspaceService } from "@buf/ponix_ponix.bufbuild_es/workspace/v1/workspace_pb"

export const organizationClient = createClient(OrganizationService, transport)
export const gatewayClient = createClient(GatewayService, transport)
export const endDeviceClient = createClient(EndDeviceService, transport)
export const userClient = createClient(UserService, transport)
export const workspaceClient = createClient(WorkspaceService, transport)

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

export { OrganizationStatus } from "@buf/ponix_ponix.bufbuild_es/organization/v1/organization_pb"

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
  GatewayStatus,
  GatewayType,
} from "@buf/ponix_ponix.bufbuild_es/gateway/v1/gateway_pb"

export type {
  EndDevice,
  CreateEndDeviceRequest,
  CreateEndDeviceResponse,
  GetEndDeviceRequest,
  GetEndDeviceResponse,
  ListEndDevicesRequest,
  ListEndDevicesResponse,
} from "@buf/ponix_ponix.bufbuild_es/end_device/v1/end_device_pb"

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

export { WorkspaceStatus } from "@buf/ponix_ponix.bufbuild_es/workspace/v1/workspace_pb"

export type {
  GetWorkspaceEndDevicesRequest,
  GetWorkspaceEndDevicesResponse,
} from "@buf/ponix_ponix.bufbuild_es/end_device/v1/end_device_pb"
