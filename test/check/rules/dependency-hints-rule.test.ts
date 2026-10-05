import { expect, test } from "bun:test";
import { DependencyHintsRule } from "../../../src/check/rules/tool-quality/dependency-hints-rule.ts";
import { context } from "./helpers.ts";

test("dependency hints require a source for identifier parameters", async () => {
	const result = await new DependencyHintsRule().computeScore(
		context({
			tools: [
				{ name: "list_users", inputSchema: { type: "object" } },
				{
					name: "get_user",
					inputSchema: {
						type: "object",
						properties: { user_id: { type: "string", description: "User ID. Call list_users first if unknown." } },
					},
				},
				{
					name: "get_team",
					inputSchema: { type: "object", properties: { teamId: { type: "string", description: "The team ID." } } },
				},
			],
		}),
	);
	expect(result.score).toBe(0.5);
	expect(result.evidence).toContain("get_team.teamId");
});
