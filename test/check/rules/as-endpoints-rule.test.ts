import { expect, test } from "bun:test";
import { AsEndpointsRule } from "../../../src/check/rules/security/as-endpoints-rule.ts";
import { httpContext } from "./helpers.ts";

test("authorization server exposes secure endpoints", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = {
		authorizationServerMetadata: {
			authorization_endpoint: "https://auth.example.com/authorize",
			token_endpoint: "https://auth.example.com/token",
		},
	};
	expect((await new AsEndpointsRule().computeScore(ctx)).score).toBe(1);
});
