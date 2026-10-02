import { expect, test } from "bun:test";
import { SchemaValidityRule } from "../../../src/check/rules/tool-quality/schema-validity-rule.ts";
import { context } from "./helpers.ts";

test("tool schemas compile as JSON Schema 2020-12", async () => {
	const result = await new SchemaValidityRule().computeScore(
		context({ tools: [{ name: "read", inputSchema: { type: "object", properties: {} } }] }),
	);
	expect(result.score).toBe(1);
});
