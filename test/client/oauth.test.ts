import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AuthFile } from "../../src/config/schemas.ts";

// Mock the SDK's refreshAuthorization before importing the provider
const mockRefreshAuthorization = mock(() =>
	Promise.resolve({
		access_token: "refreshed-access-token",
		token_type: "Bearer",
		expires_in: 7200,
		refresh_token: "new-refresh-token",
	}),
);

const mockAuth = mock(() => Promise.resolve("AUTHORIZED"));

mock.module("../../src/client/oauth-api.ts", () => ({
	auth: mockAuth,
	discoverOAuthServerInfo: mock(),
	refreshAuthorization: mockRefreshAuthorization,
}));

import {
	AuthRequiredError,
	completeAuthorizationCode,
	createConnectAuthProvider,
	isAuthError,
	McpOAuthProvider,
	resolveAuthorizationIssuer,
	startCallbackServer,
} from "../../src/client/oauth.ts";
import { logger } from "../../src/output/logger.ts";

function makeProvider(auth: AuthFile = {}, serverName = "test-server") {
	const configDir = "/tmp/mcpx-test";
	return new McpOAuthProvider({ serverName, configDir, auth });
}

describe("McpOAuthProvider", () => {
	test("tokens() returns undefined for unknown server", () => {
		const provider = makeProvider();
		expect(provider.tokens()).toBeUndefined();
	});

	test("saveTokens() + tokens() round-trip", async () => {
		const dir = await mkdtemp(join(tmpdir(), "mcpx-oauth-"));
		const auth: AuthFile = {};
		const provider = new McpOAuthProvider({ serverName: "srv", configDir: dir, auth });

		await provider.saveTokens({
			access_token: "abc",
			token_type: "Bearer",
		});

		const tokens = provider.tokens();
		expect(tokens?.access_token).toBe("abc");
		expect(tokens?.token_type).toBe("Bearer");

		await rm(dir, { recursive: true });
	});

	test("saveTokens() computes expires_at from expires_in", async () => {
		const dir = await mkdtemp(join(tmpdir(), "mcpx-oauth-"));
		const auth: AuthFile = {};
		const provider = new McpOAuthProvider({ serverName: "srv", configDir: dir, auth });

		const before = Date.now();
		await provider.saveTokens({
			access_token: "abc",
			token_type: "Bearer",
			expires_in: 3600,
		});
		const after = Date.now();

		const expiresAt = new Date(auth.srv?.expires_at!).getTime();
		expect(expiresAt).toBeGreaterThanOrEqual(before + 3600 * 1000);
		expect(expiresAt).toBeLessThanOrEqual(after + 3600 * 1000);

		await rm(dir, { recursive: true });
	});

	test("clientInformation() / saveClientInformation() round-trip", async () => {
		const dir = await mkdtemp(join(tmpdir(), "mcpx-oauth-"));
		const auth: AuthFile = {};
		const provider = new McpOAuthProvider({ serverName: "srv", configDir: dir, auth });

		expect(provider.clientInformation()).toBeUndefined();

		await provider.saveClientInformation({
			client_id: "my-client",
			client_secret: "secret",
		});

		const info = provider.clientInformation();
		expect(info?.client_id).toBe("my-client");

		await rm(dir, { recursive: true });
	});

	test("codeVerifier in-memory round-trip", async () => {
		const provider = makeProvider();
		await provider.saveCodeVerifier("verifier-123");
		expect(provider.codeVerifier()).toBe("verifier-123");
	});

	test("discoveryState in-memory round-trip", async () => {
		const provider = makeProvider();
		expect(provider.discoveryState()).toBeUndefined();
		await provider.saveDiscoveryState({
			authorizationServerUrl: "https://api.toolexec.ai",
			authorizationServerMetadata: {
				issuer: "https://api.toolexec.ai",
				authorization_endpoint: "https://api.toolexec.ai/oauth/authorize",
				token_endpoint: "https://api.toolexec.ai/oauth/token",
				response_types_supported: ["code"],
			},
		});
		expect(provider.discoveryState()?.authorizationServerMetadata?.issuer).toBe("https://api.toolexec.ai");
	});

	test("invalidateCredentials clears discovery scope", async () => {
		const provider = makeProvider();
		await provider.saveDiscoveryState({
			authorizationServerUrl: "https://api.toolexec.ai",
			authorizationServerMetadata: {
				issuer: "https://api.toolexec.ai",
				authorization_endpoint: "https://api.toolexec.ai/oauth/authorize",
				token_endpoint: "https://api.toolexec.ai/oauth/token",
				response_types_supported: ["code"],
			},
		});
		await provider.invalidateCredentials("discovery");
		expect(provider.discoveryState()).toBeUndefined();
	});

	test("codeVerifier() throws when unset", () => {
		const provider = makeProvider();
		expect(() => provider.codeVerifier()).toThrow("Code verifier not set");
	});

	test("isExpired() returns true for past date", () => {
		const auth: AuthFile = {
			"test-server": {
				tokens: { access_token: "t", token_type: "Bearer" },
				expires_at: new Date(Date.now() - 60000).toISOString(),
			},
		};
		const provider = makeProvider(auth);
		expect(provider.isExpired()).toBe(true);
	});

	test("isExpired() returns false for future date", () => {
		const auth: AuthFile = {
			"test-server": {
				tokens: { access_token: "t", token_type: "Bearer" },
				expires_at: new Date(Date.now() + 60000).toISOString(),
			},
		};
		const provider = makeProvider(auth);
		expect(provider.isExpired()).toBe(false);
	});

	test("isExpired() returns false when no expires_at", () => {
		const auth: AuthFile = {
			"test-server": {
				tokens: { access_token: "t", token_type: "Bearer" },
			},
		};
		const provider = makeProvider(auth);
		expect(provider.isExpired()).toBe(false);
	});

	test("invalidateCredentials clears tokens scope", async () => {
		const dir = await mkdtemp(join(tmpdir(), "mcpx-oauth-"));
		const auth: AuthFile = {
			srv: {
				tokens: { access_token: "t", token_type: "Bearer" },
				client_info: { client_id: "c" },
			},
		};
		const provider = new McpOAuthProvider({ serverName: "srv", configDir: dir, auth });

		await provider.invalidateCredentials("tokens");
		expect(provider.tokens()?.access_token).toBeUndefined();
		// client_info should be preserved
		expect(provider.clientInformation()?.client_id).toBe("c");

		await rm(dir, { recursive: true });
	});

	test("invalidateCredentials clears all scope", async () => {
		const dir = await mkdtemp(join(tmpdir(), "mcpx-oauth-"));
		const auth: AuthFile = {
			srv: {
				tokens: { access_token: "t", token_type: "Bearer" },
				client_info: { client_id: "c" },
			},
		};
		const provider = new McpOAuthProvider({ serverName: "srv", configDir: dir, auth });

		await provider.invalidateCredentials("all");
		expect(provider.tokens()).toBeUndefined();
		expect(provider.clientInformation()).toBeUndefined();

		await rm(dir, { recursive: true });
	});

	test("redirectUrl includes callback port", () => {
		const provider = makeProvider();
		provider.setCallbackPort(12345);
		expect(provider.redirectUrl).toBe("http://127.0.0.1:12345/callback");
	});

	test("redirectToAuthorization throws when no callback server is running", async () => {
		const provider = makeProvider();
		await expect(provider.redirectToAuthorization(new URL("https://example.com/authorize"))).rejects.toThrow(
			AuthRequiredError,
		);
	});
});

describe("createConnectAuthProvider", () => {
	test("returns undefined when auth is not complete", () => {
		const provider = makeProvider();
		expect(
			createConnectAuthProvider({ provider, serverName: "test-server", serverUrl: "http://example.com" }),
		).toBeUndefined();
	});

	test("token() returns the stored access token", async () => {
		const auth: AuthFile = {
			"test-server": {
				tokens: { access_token: "live-token", token_type: "Bearer" },
				complete: true,
			},
		};
		const provider = makeProvider(auth);
		const connect = createConnectAuthProvider({
			provider,
			serverName: "test-server",
			serverUrl: "http://example.com",
		});
		expect(await connect?.token()).toBe("live-token");
	});

	test("onUnauthorized throws AuthRequiredError when there is no refresh token", async () => {
		const auth: AuthFile = {
			"test-server": {
				tokens: { access_token: "expired-token", token_type: "Bearer" },
				complete: true,
			},
		};
		const provider = makeProvider(auth);
		const connect = createConnectAuthProvider({
			provider,
			serverName: "test-server",
			serverUrl: "http://example.com",
		});
		await expect(connect?.onUnauthorized?.({} as never)).rejects.toThrow(AuthRequiredError);
	});

	test("onUnauthorized refreshes when a refresh token is available", async () => {
		const dir = await mkdtemp(join(tmpdir(), "mcpx-oauth-connect-"));
		try {
			const auth: AuthFile = {
				"test-server": {
					tokens: {
						access_token: "old-token",
						token_type: "Bearer",
						refresh_token: "my-refresh-token",
					},
					client_info: { client_id: "my-client", client_secret: "my-secret" },
					complete: true,
				},
			};
			const provider = new McpOAuthProvider({
				serverName: "test-server",
				configDir: dir,
				auth,
			});
			const connect = createConnectAuthProvider({
				provider,
				serverName: "test-server",
				serverUrl: "http://example.com",
			});
			mockRefreshAuthorization.mockClear();
			await connect?.onUnauthorized?.({} as never);
			expect(mockRefreshAuthorization).toHaveBeenCalledTimes(1);
			expect(provider.tokens()?.access_token).toBe("refreshed-access-token");
		} finally {
			await rm(dir, { recursive: true });
		}
	});
});

describe("isAuthError", () => {
	test("matches AuthRequiredError and its cause chain", () => {
		const authErr = new AuthRequiredError("srv");
		expect(isAuthError(authErr)).toBe(true);
		expect(isAuthError(new Error("wrapped", { cause: authErr }))).toBe(true);
		expect(isAuthError(new Error("other"))).toBe(false);
	});
});

describe("refreshIfNeeded", () => {
	test("no-op when token is not expired", async () => {
		const auth: AuthFile = {
			"test-server": {
				tokens: { access_token: "t", token_type: "Bearer" },
				expires_at: new Date(Date.now() + 60000).toISOString(),
			},
		};
		const provider = makeProvider(auth);
		// Should not throw — token is still valid
		await provider.refreshIfNeeded("http://example.com");
	});

	test("throws when expired with no refresh token", async () => {
		const auth: AuthFile = {
			"test-server": {
				tokens: { access_token: "t", token_type: "Bearer" },
				expires_at: new Date(Date.now() - 60000).toISOString(),
			},
		};
		const provider = makeProvider(auth);
		await expect(provider.refreshIfNeeded("http://example.com")).rejects.toThrow("no refresh token available");
	});

	test("throws when expired with refresh token but no client info", async () => {
		const auth: AuthFile = {
			"test-server": {
				tokens: {
					access_token: "old-token",
					token_type: "Bearer",
					refresh_token: "my-refresh-token",
				},
				expires_at: new Date(Date.now() - 60000).toISOString(),
			},
		};
		const provider = makeProvider(auth);
		await expect(provider.refreshIfNeeded("http://example.com")).rejects.toThrow("No client information");
	});

	test("refreshes token when expired with refresh token and client info", async () => {
		const dir = await mkdtemp(join(tmpdir(), "mcpx-oauth-refresh-"));
		const origIsTTY = process.stderr.isTTY;
		Object.defineProperty(process.stderr, "isTTY", { value: true, writable: true });
		const stderrSpy = spyOn(process.stderr, "write").mockReturnValue(true);
		logger.configure({});
		try {
			const auth: AuthFile = {
				"test-server": {
					tokens: {
						access_token: "old-expired-token",
						token_type: "Bearer",
						refresh_token: "my-refresh-token",
					},
					expires_at: new Date(Date.now() - 60000).toISOString(),
					client_info: { client_id: "my-client", client_secret: "my-secret" },
					complete: true,
				},
			};
			const provider = new McpOAuthProvider({
				serverName: "test-server",
				configDir: dir,
				auth,
			});

			mockRefreshAuthorization.mockClear();

			await provider.refreshIfNeeded("http://example.com");

			// Verify refreshAuthorization was called with correct args
			expect(mockRefreshAuthorization).toHaveBeenCalledTimes(1);
			expect(mockRefreshAuthorization).toHaveBeenCalledWith("http://example.com", {
				clientInformation: { client_id: "my-client", client_secret: "my-secret" },
				refreshToken: "my-refresh-token",
			});

			// Verify new tokens were saved in memory
			const tokens = provider.tokens();
			expect(tokens?.access_token).toBe("refreshed-access-token");
			expect(tokens?.refresh_token).toBe("new-refresh-token");

			// Verify expires_at was updated to a future date
			const expiresAt = new Date(auth["test-server"]?.expires_at!).getTime();
			expect(expiresAt).toBeGreaterThan(Date.now());

			// Verify auth.json was written to disk
			const diskContent = await readFile(join(dir, "auth.json"), "utf-8");
			const diskAuth = JSON.parse(diskContent);
			expect(diskAuth["test-server"].tokens.access_token).toBe("refreshed-access-token");

			// Verify refresh was logged to stderr
			expect(stderrSpy).toHaveBeenCalled();
			const written = stderrSpy.mock.calls.map((c) => String(c[0])).join("");
			expect(written).toContain('Token refreshed for "test-server"');
		} finally {
			stderrSpy.mockRestore();
			Object.defineProperty(process.stderr, "isTTY", { value: origIsTTY, writable: true });
			await rm(dir, { recursive: true });
		}
	});
});

describe("startCallbackServer", () => {
	let server: ReturnType<typeof Bun.serve> | undefined;

	afterEach(() => {
		if (server) {
			server.stop();
			server = undefined;
		}
	});

	test("returns authorization code on /callback?code=xxx", async () => {
		const result = startCallbackServer();
		server = result.server;

		const url = `http://127.0.0.1:${server.port}/callback?code=test-code-123`;
		const response = await fetch(url);
		expect(response.status).toBe(200);
		const html = await response.text();
		expect(html).toContain("Authenticated");

		const callback = await result.authCodePromise;
		expect(callback.code).toBe("test-code-123");
		expect(callback.iss).toBeUndefined();
	});

	test("captures RFC 9207 iss from the callback query", async () => {
		const result = startCallbackServer();
		server = result.server;

		const url = `http://127.0.0.1:${server.port}/callback?code=test-code-123&iss=https%3A%2F%2Fapi.toolexec.ai`;
		const response = await fetch(url);
		expect(response.status).toBe(200);

		const callback = await result.authCodePromise;
		expect(callback.code).toBe("test-code-123");
		expect(callback.iss).toBe("https://api.toolexec.ai");
	});

	test("treats empty iss as absent", async () => {
		const result = startCallbackServer();
		server = result.server;

		const url = `http://127.0.0.1:${server.port}/callback?code=test-code-123&iss=`;
		await fetch(url);

		const callback = await result.authCodePromise;
		expect(callback.code).toBe("test-code-123");
		expect(callback.iss).toBeUndefined();
	});

	test("rejects on /callback?error=access_denied", async () => {
		const result = startCallbackServer();
		server = result.server;

		// Catch rejection to prevent unhandled rejection
		const errorPromise = result.authCodePromise.catch((err) => err);

		const url = `http://127.0.0.1:${server.port}/callback?error=access_denied&error_description=User+denied`;
		await fetch(url);

		const err = await errorPromise;
		expect(err).toBeInstanceOf(Error);
		expect((err as Error).message).toContain("OAuth error: User denied");
	});

	test("returns 404 on unknown paths", async () => {
		const result = startCallbackServer();
		server = result.server;

		const response = await fetch(`http://127.0.0.1:${server.port}/other`);
		expect(response.status).toBe(404);
	});
});

describe("resolveAuthorizationIssuer", () => {
	test("uses the callback iss when present", () => {
		expect(resolveAuthorizationIssuer("https://evil.example", "https://api.toolexec.ai")).toBe("https://evil.example");
	});

	test("falls back to the recorded issuer when callback iss is undefined", () => {
		expect(resolveAuthorizationIssuer(undefined, "https://api.toolexec.ai")).toBe("https://api.toolexec.ai");
	});

	test("treats an empty callback iss as absent", () => {
		expect(resolveAuthorizationIssuer("", "https://api.toolexec.ai")).toBe("https://api.toolexec.ai");
	});

	test("returns undefined when neither issuer is available", () => {
		expect(resolveAuthorizationIssuer(undefined, undefined)).toBeUndefined();
	});
});

describe("completeAuthorizationCode", () => {
	test("passes a present callback iss through to auth()", async () => {
		const provider = makeProvider();
		await provider.saveDiscoveryState({
			authorizationServerUrl: "https://api.toolexec.ai",
			authorizationServerMetadata: {
				issuer: "https://api.toolexec.ai",
				authorization_endpoint: "https://api.toolexec.ai/oauth/authorize",
				token_endpoint: "https://api.toolexec.ai/oauth/token",
				response_types_supported: ["code"],
			},
		});
		mockAuth.mockClear();
		mockAuth.mockResolvedValueOnce("AUTHORIZED");

		await completeAuthorizationCode(provider, "https://api.toolexec.ai/mcp", {
			code: "auth-code",
			iss: "https://api.toolexec.ai",
		});

		expect(mockAuth).toHaveBeenCalledTimes(1);
		expect(mockAuth).toHaveBeenCalledWith(provider, {
			serverUrl: "https://api.toolexec.ai/mcp",
			authorizationCode: "auth-code",
			iss: "https://api.toolexec.ai",
		});
	});

	test("does not treat a missing callback iss as a mismatch", async () => {
		const provider = makeProvider();
		await provider.saveDiscoveryState({
			authorizationServerUrl: "https://api.toolexec.ai",
			authorizationServerMetadata: {
				issuer: "https://api.toolexec.ai",
				authorization_endpoint: "https://api.toolexec.ai/oauth/authorize",
				token_endpoint: "https://api.toolexec.ai/oauth/token",
				response_types_supported: ["code"],
				authorization_response_iss_parameter_supported: true,
			},
		});
		mockAuth.mockClear();
		mockAuth.mockResolvedValueOnce("AUTHORIZED");

		await completeAuthorizationCode(provider, "https://api.toolexec.ai/mcp", {
			code: "auth-code",
		});

		expect(mockAuth).toHaveBeenCalledWith(provider, {
			serverUrl: "https://api.toolexec.ai/mcp",
			authorizationCode: "auth-code",
			iss: "https://api.toolexec.ai",
		});
	});

	test("forwards a present-but-different callback iss so the SDK can reject it", async () => {
		const provider = makeProvider();
		await provider.saveDiscoveryState({
			authorizationServerUrl: "https://api.toolexec.ai",
			authorizationServerMetadata: {
				issuer: "https://api.toolexec.ai",
				authorization_endpoint: "https://api.toolexec.ai/oauth/authorize",
				token_endpoint: "https://api.toolexec.ai/oauth/token",
				response_types_supported: ["code"],
			},
		});
		mockAuth.mockClear();
		mockAuth.mockResolvedValueOnce("AUTHORIZED");

		await completeAuthorizationCode(provider, "https://api.toolexec.ai/mcp", {
			code: "auth-code",
			iss: "https://evil.example",
		});

		expect(mockAuth).toHaveBeenCalledWith(provider, {
			serverUrl: "https://api.toolexec.ai/mcp",
			authorizationCode: "auth-code",
			iss: "https://evil.example",
		});
	});
});
