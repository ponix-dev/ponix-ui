import type { Transport } from "@connectrpc/connect"
import { createQueryOptions } from "@connectrpc/connect-query"

// Organization queries
import { userOrganizations } from "@buf/ponix_ponix.connectrpc_query-es/organization/v1/organization-OrganizationService_connectquery"

// Gateway queries
import {
  listGateways,
  getGateway,
} from "@buf/ponix_ponix.connectrpc_query-es/gateway/v1/gateway-GatewayService_connectquery"

// Workspace queries
import {
  listWorkspaces,
  getWorkspace,
} from "@buf/ponix_ponix.connectrpc_query-es/workspace/v1/workspace-WorkspaceService_connectquery"

// End device queries
import { getWorkspaceEndDevices } from "@buf/ponix_ponix.connectrpc_query-es/end_device/v1/end_device-EndDeviceService_connectquery"

// End device definition queries
import {
  listEndDeviceDefinitions,
  getEndDeviceDefinition,
} from "@buf/ponix_ponix.connectrpc_query-es/end_device/v1/end_device_definition-EndDeviceDefinitionService_connectquery"

// Organization query options
export const organizationsQueryOptions = (transport: Transport, userId: string) =>
  createQueryOptions(userOrganizations, { userId }, { transport })

// Gateway query options
export const gatewaysQueryOptions = (transport: Transport, orgId: string) =>
  createQueryOptions(listGateways, { organizationId: orgId }, { transport })

export const gatewayQueryOptions = (transport: Transport, orgId: string, gatewayId: string) =>
  createQueryOptions(getGateway, { organizationId: orgId, gatewayId }, { transport })

// Workspace query options
export const workspacesQueryOptions = (transport: Transport, orgId: string) =>
  createQueryOptions(listWorkspaces, { organizationId: orgId }, { transport })

export const workspaceQueryOptions = (transport: Transport, orgId: string, workspaceId: string) =>
  createQueryOptions(getWorkspace, { organizationId: orgId, workspaceId }, { transport })

// Device query options
export const devicesQueryOptions = (transport: Transport, orgId: string, workspaceId: string) =>
  createQueryOptions(getWorkspaceEndDevices, { organizationId: orgId, workspaceId }, { transport })

// Definition query options
export const definitionsQueryOptions = (transport: Transport, orgId: string) =>
  createQueryOptions(listEndDeviceDefinitions, { organizationId: orgId }, { transport })

export const definitionQueryOptions = (transport: Transport, orgId: string, definitionId: string) =>
  createQueryOptions(getEndDeviceDefinition, { organizationId: orgId, id: definitionId }, { transport })
