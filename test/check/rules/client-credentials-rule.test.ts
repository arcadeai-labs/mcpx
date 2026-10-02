import { expect, test } from "bun:test";
import { ClientCredentialsRule } from "../../../src/check/rules/security/client-credentials-rule.ts";
import { httpContext } from "./helpers.ts";

test("client credentials readiness is recognized", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { authorizationServerMetadata: { grant_types_supported: ["client_credentials"] } };
	expect((await new ClientCredentialsRule().computeScore(ctx)).score).toBe(1);
});
