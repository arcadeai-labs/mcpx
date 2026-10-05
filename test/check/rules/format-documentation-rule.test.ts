import { expect, test } from "bun:test";
import { FormatDocumentationRule } from "../../../src/check/rules/tool-quality/format-documentation-rule.ts";
import { context } from "./helpers.ts";

test("format documentation requires a format for date parameters", async () => {
	const result = await new FormatDocumentationRule().computeScore(
		context({
			tools: [
				{
					name: "list_events",
					inputSchema: {
						type: "object",
						properties: {
							start_date: { type: "string", format: "date" },
							updated_since: { type: "string", description: "ISO 8601 timestamp" },
							created_at: { type: "string", description: "When it was created" },
							timeout_seconds: { type: "number" },
							time_zone: { type: "string" },
						},
					},
				},
			],
		}),
	);
	expect(result.score).toBeCloseTo(2 / 3);
	expect(result.evidence).toContain("list_events.created_at");
});
