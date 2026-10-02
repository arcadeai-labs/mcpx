import { expect, test } from "bun:test";
import { PrmResourceRule } from "../../../src/check/rules/security/prm-resource-rule.ts";
import { httpContext } from "./helpers.ts";

test("protected resource matches the MCP origin", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { resource: "https://example.com/mcp" };
	expect((await new PrmResourceRule().computeScore(ctx)).score).toBe(1);
});
