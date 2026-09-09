import { StreamableHTTPClientTransport } from "@modelcontextprotocol/client";
import { buildTransportInit, type TransportDeps } from "./transport-options.ts";

export function createHttpTransport(deps: TransportDeps): StreamableHTTPClientTransport {
	return new StreamableHTTPClientTransport(new URL(deps.config.url), buildTransportInit(deps));
}
