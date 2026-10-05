import { expect, test } from "bun:test";
import { DescriptionSubstanceRule } from "../../../src/check/rules/tool-quality/description-substance-rule.ts";
import { context } from "./helpers.ts";

test("description substance penalizes restated and terse descriptions", async () => {
	const result = await new DescriptionSubstanceRule().computeScore(
		context({
			tools: [
				{ name: "get_user", description: "Gets the user.", inputSchema: { type: "object" } },
				{ name: "list_teams", description: "Lists teams by region.", inputSchema: { type: "object" } },
				{
					name: "send_message",
					description: "Send a chat message to a channel. Returns the message ID and permalink.",
					inputSchema: { type: "object" },
				},
			],
		}),
	);
	expect(result.score).toBe(0.5);
	expect(result.evidence).toContain("get_user");
	expect(result.evidence).toContain("list_teams");
});
