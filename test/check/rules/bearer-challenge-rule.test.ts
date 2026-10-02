import { expect, test } from "bun:test";
import { BearerChallengeRule } from "../../../src/check/rules/security/bearer-challenge-rule.ts";
import { httpContext } from "./helpers.ts";

test("challenge uses Bearer", async () => {
	const ctx = httpContext();
	ctx.http!.challenge = { scheme: "Bearer", params: {} };
	expect((await new BearerChallengeRule().computeScore(ctx)).score).toBe(1);
});
