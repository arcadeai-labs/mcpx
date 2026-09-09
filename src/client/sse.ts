import { SSEClientTransport } from "@modelcontextprotocol/client";
import { buildTransportInit, type TransportDeps } from "./transport-options.ts";

export function createSseTransport(deps: TransportDeps): SSEClientTransport {
	return new SSEClientTransport(new URL(deps.config.url), buildTransportInit(deps));
}
