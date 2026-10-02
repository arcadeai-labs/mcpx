import { expect, test } from "bun:test";
import { ProtocolHeaderRule } from "../../../src/check/rules/protocol/protocol-header-rule.ts";
import { httpContext } from "./helpers.ts";

test("protocol header validation requires rejection", async () => {
	const ctx = httpContext();
	ctx.http!.invalidProtocolVersion = { status: 400, headers: {} };
	expect((await new ProtocolHeaderRule().computeScore(ctx)).score).toBe(1);
});
