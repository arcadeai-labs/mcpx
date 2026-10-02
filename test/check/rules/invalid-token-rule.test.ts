import { expect, test } from "bun:test";
import { InvalidTokenRule } from "../../../src/check/rules/security/invalid-token-rule.ts";
import { httpContext } from "./helpers.ts";

test("invalid bearer tokens are rejected", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = {};
	ctx.http!.invalidTokenStatus = 401;
	expect((await new InvalidTokenRule().computeScore(ctx)).score).toBe(1);
});
