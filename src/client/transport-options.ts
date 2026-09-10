import type { AuthProvider, OAuthClientProvider } from "@modelcontextprotocol/client";
import pkg from "../../package.json";
import type { HttpServerConfig } from "../config/schemas.ts";
import { createDebugFetch, type FetchLike } from "./debug-fetch.ts";

export type TransportAuthProvider = AuthProvider | OAuthClientProvider;

export interface TransportDeps {
	config: HttpServerConfig;
	authProvider?: TransportAuthProvider;
	verbose?: boolean;
	showSecrets?: boolean;
}

/** Build shared transport init options (auth, headers, User-Agent, debug fetch) */
export function buildTransportInit(deps: TransportDeps): {
	authProvider?: TransportAuthProvider;
	requestInit: RequestInit;
	fetch?: FetchLike;
} {
	const { config, authProvider, verbose = false, showSecrets = false } = deps;
	const userAgent = `${pkg.name}/${pkg.version}`;
	return {
		authProvider,
		requestInit: {
			headers: {
				"User-Agent": userAgent,
				...config.headers,
			},
		},
		fetch: verbose ? createDebugFetch(showSecrets) : undefined,
	};
}
