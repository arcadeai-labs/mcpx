import { expect, test } from "bun:test";
import { SessionTerminationRule } from "../../../src/check/rules/protocol/session-termination-rule.ts";
import { httpContext } from "./helpers.ts";

test("session termination accepts successful DELETE", async () => {
	const ctx = httpContext();
	ctx.http!.sessionTermination = { status: 200, headers: {} };
	expect((await new SessionTerminationRule().computeScore(ctx)).score).toBe(1);
});
