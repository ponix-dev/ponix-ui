import { createGrpcWebTransport } from "@connectrpc/connect-web"

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:50051"

export const transport = createGrpcWebTransport({
  baseUrl: API_URL,
})
