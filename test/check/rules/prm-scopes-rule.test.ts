import { expect, test } from "bun:test";
import { PrmScopesRule } from "../../../src/check/rules/security/prm-scopes-rule.ts";
import { httpContext } from "./helpers.ts";

test("protected resource scopes are strings", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { resourceMetadata: { scopes_supported: ["mcp"] } };
	expect((await new PrmScopesRule().computeScore(ctx)).score).toBe(1);
});
