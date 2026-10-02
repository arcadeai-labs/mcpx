import { expect, test } from "bun:test";
import { UnauthorizedStatusRule } from "../../../src/check/rules/security/unauthorized-status-rule.ts";
import { httpContext } from "./helpers.ts";

test("protected servers return 401", async () => {
	const ctx = httpContext();
	ctx.http!.unauthenticatedStatus = 401;
	ctx.http!.oauth = {};
	expect((await new UnauthorizedStatusRule().computeScore(ctx)).score).toBe(1);
});
