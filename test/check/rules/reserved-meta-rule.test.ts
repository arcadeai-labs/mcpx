import { expect, test } from "bun:test";
import { ReservedMetaRule } from "../../../src/check/rules/protocol/reserved-meta-rule.ts";
import { httpContext } from "./helpers.ts";

test("reserved meta requires request acceptance", async () => {
	const ctx = httpContext();
	ctx.http!.reservedMeta = { status: 200, headers: {} };
	expect((await new ReservedMetaRule().computeScore(ctx)).score).toBe(1);
});
