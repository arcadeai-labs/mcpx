import { expect, test } from "bun:test";
import { ChallengeScopeRule } from "../../../src/check/rules/security/challenge-scope-rule.ts";
import { httpContext } from "./helpers.ts";

test("challenge scope uses valid tokens", async () => {
	const ctx = httpContext();
	ctx.http!.challenge = { params: { scope: "mcp read" } };
	expect((await new ChallengeScopeRule().computeScore(ctx)).score).toBe(1);
});
