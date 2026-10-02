import { expect, test } from "bun:test";
import { ProtocolVersionRule } from "../../../src/check/rules/protocol/protocol-version-rule.ts";
import { context } from "./helpers.ts";

test("protocol version credits the modern era", async () => {
	expect((await new ProtocolVersionRule().computeScore(context())).score).toBe(1);
});
