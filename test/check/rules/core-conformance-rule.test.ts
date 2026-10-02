import { expect, test } from "bun:test";
import { CoreConformanceRule } from "../../../src/check/rules/protocol/core-conformance-rule.ts";
import { context } from "./helpers.ts";

test("core conformance checks ping, names, and schemas", async () => {
	const result = await new CoreConformanceRule().computeScore(
		context({ tools: [{ name: "valid-tool", description: "Valid", inputSchema: { type: "object" } }] }),
	);
	expect(result.score).toBe(1);
});
