import { expect, test } from "bun:test";
import { OidcDiscoveryRule } from "../../../src/check/rules/security/oidc-discovery-rule.ts";
import { httpContext } from "./helpers.ts";

test("OIDC discovery succeeds when present", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { oidcStatus: 200 };
	expect((await new OidcDiscoveryRule().computeScore(ctx)).score).toBe(1);
});
