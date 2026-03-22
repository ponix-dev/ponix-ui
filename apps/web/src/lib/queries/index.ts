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

// Data stream queries
import {
  getWorkspaceDataStreams,
  getGatewayDataStreams,
} from "@buf/ponix_ponix.connectrpc_query-es/data_stream/v1/data_stream-DataStreamService_connectquery"

// Data stream definition queries
import {
  listDataStreamDefinitions,
  getDataStreamDefinition,
} from "@buf/ponix_ponix.connectrpc_query-es/data_stream/v1/data_stream_definition-DataStreamDefinitionService_connectquery"

// Document queries
import {
  getDocument,
  listDataStreamDocuments,
  listDefinitionDocuments,
  listWorkspaceDocuments,
} from "@buf/ponix_ponix.connectrpc_query-es/document/v1/document-DocumentService_connectquery"

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

// Data stream query options
export const dataStreamsQueryOptions = (transport: Transport, orgId: string, workspaceId: string) =>
  createQueryOptions(getWorkspaceDataStreams, { organizationId: orgId, workspaceId }, { transport })

export const gatewayDataStreamsQueryOptions = (transport: Transport, orgId: string, gatewayId: string) =>
  createQueryOptions(getGatewayDataStreams, { organizationId: orgId, gatewayId }, { transport })

// Definition query options
export const definitionsQueryOptions = (transport: Transport, orgId: string) =>
  createQueryOptions(listDataStreamDefinitions, { organizationId: orgId }, { transport })

export const definitionQueryOptions = (transport: Transport, orgId: string, definitionId: string) =>
  createQueryOptions(getDataStreamDefinition, { organizationId: orgId, id: definitionId }, { transport })

// Document query options
export const documentQueryOptions = (transport: Transport, orgId: string, documentId: string) =>
  createQueryOptions(getDocument, { organizationId: orgId, documentId }, { transport })

export const dataStreamDocumentsQueryOptions = (transport: Transport, orgId: string, workspaceId: string, dataStreamId: string) =>
  createQueryOptions(listDataStreamDocuments, { organizationId: orgId, workspaceId, dataStreamId }, { transport })

export const definitionDocumentsQueryOptions = (transport: Transport, orgId: string, definitionId: string) =>
  createQueryOptions(listDefinitionDocuments, { organizationId: orgId, definitionId }, { transport })

export const workspaceDocumentsQueryOptions = (transport: Transport, orgId: string, workspaceId: string) =>
  createQueryOptions(listWorkspaceDocuments, { organizationId: orgId, workspaceId }, { transport })
