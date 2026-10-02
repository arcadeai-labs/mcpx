import { expect, test } from "bun:test";
import { AuthorizationDiscoveryRule } from "../../../src/check/rules/security/authorization-discovery-rule.ts";
import { httpContext } from "./helpers.ts";

test("authorization discovery accepts either standard endpoint", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { rfc8414Status: 200, oidcStatus: 404 };
	expect((await new AuthorizationDiscoveryRule().computeScore(ctx)).score).toBe(1);
});
