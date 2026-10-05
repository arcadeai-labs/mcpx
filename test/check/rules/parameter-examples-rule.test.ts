import { expect, test } from "bun:test";
import { ParameterExamplesRule } from "../../../src/check/rules/tool-quality/parameter-examples-rule.ts";
import { context } from "./helpers.ts";

test("parameter examples looks for examples on free-form strings", async () => {
	const result = await new ParameterExamplesRule().computeScore(
		context({
			tools: [
				{
					name: "get_user",
					inputSchema: {
						type: "object",
						properties: {
							identifier: { type: "string", description: "Email or ID, e.g. usr_abc123" },
							repo: { type: "string", examples: ["octo/hello"] },
							team: { type: "string", description: "Team slug" },
							message: { type: "string" },
						},
					},
				},
			],
		}),
	);
	expect(result.score).toBeCloseTo(2 / 3);
	expect(result.evidence).toContain("get_user.team");
});
