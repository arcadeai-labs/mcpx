import { expect, test } from "bun:test";
import { NamingConsistencyRule } from "../../../src/check/rules/tool-quality/naming-consistency-rule.ts";
import { context } from "./helpers.ts";

const tool = (name: string, properties: string[]) => ({
	name,
	inputSchema: {
		type: "object" as const,
		properties: Object.fromEntries(properties.map((p) => [p, { type: "string" }])),
	},
});

test("naming consistency passes one style and one name per concept", async () => {
	const result = await new NamingConsistencyRule().computeScore(
		context({ tools: [tool("list_a", ["limit", "page_token"]), tool("list_b", ["limit", "user_id"])] }),
	);
	expect(result.score).toBe(1);
});

test("naming consistency flags synonym and casing drift", async () => {
	const result = await new NamingConsistencyRule().computeScore(
		context({ tools: [tool("list_a", ["limit", "user_id"]), tool("list_b", ["max_results", "teamId"])] }),
	);
	expect(result.score).toBe(0.375);
	expect(result.evidence).toContain("limit / max_results");
	expect(result.evidence).toContain("teamId");
});
