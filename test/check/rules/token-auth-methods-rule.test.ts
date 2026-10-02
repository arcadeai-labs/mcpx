import { expect, test } from "bun:test";
import { TokenAuthMethodsRule } from "../../../src/check/rules/security/token-auth-methods-rule.ts";
import { httpContext } from "./helpers.ts";

test("token endpoint auth methods are advertised", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { authorizationServerMetadata: { token_endpoint_auth_methods_supported: ["none"] } };
	expect((await new TokenAuthMethodsRule().computeScore(ctx)).score).toBe(1);
});
