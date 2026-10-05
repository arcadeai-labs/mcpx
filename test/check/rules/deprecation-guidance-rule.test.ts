import { expect, test } from "bun:test";
import { DeprecationGuidanceRule } from "../../../src/check/rules/tool-quality/deprecation-guidance-rule.ts";
import { context } from "./helpers.ts";

test("deprecation guidance requires superseded tools to name a replacement", async () => {
	const result = await new DeprecationGuidanceRule().computeScore(
		context({
			tools: [
				{ name: "create_user", description: "Create a user.", inputSchema: { type: "object" } },
				{ name: "create_user_v2", description: "Create a user with a team.", inputSchema: { type: "object" } },
				{ name: "old_search", description: "Deprecated: use create_user_v2 instead.", inputSchema: { type: "object" } },
			],
		}),
	);
	expect(result.score).toBe(0.5);
	expect(result.evidence).toContain("create_user");
});

test("deprecation guidance skips servers without versions or deprecations", async () => {
	const result = await new DeprecationGuidanceRule().computeScore(
		context({ tools: [{ name: "get_kv2", inputSchema: { type: "object" } }] }),
	);
	expect(result.status).toBe("skip");
});
