// Organization types
export interface Organization {
  id: string
  name: string
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// Gateway types
export type GatewayType = "EMQX"

export interface EmqxConfig {
  brokerUrl: string
}

export interface Gateway {
  id: string
  organizationId: string
  type: GatewayType
  config: EmqxConfig
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date
}

// End Device types
export interface PayloadContract {
  matchExpression: string
  transformExpression: string
  jsonSchema: string
}

export interface EndDevice {
  id: string
  organizationId: string
  name: string
  contracts: PayloadContract[]
  createdAt: Date
  updatedAt: Date
}
