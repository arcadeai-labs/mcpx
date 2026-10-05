import { expect, test } from "bun:test";
import { PaginationRule } from "../../../src/check/rules/tool-quality/pagination-rule.ts";
import { context } from "./helpers.ts";

test("pagination rewards bounded limits and cursors on list tools", async () => {
	const result = await new PaginationRule().computeScore(
		context({
			tools: [
				{
					name: "list_contacts",
					inputSchema: {
						type: "object",
						properties: { limit: { type: "integer", default: 50, maximum: 200 }, cursor: { type: "string" } },
					},
				},
				{ name: "search_files", inputSchema: { type: "object", properties: { query: { type: "string" } } } },
				{ name: "get_contact", inputSchema: { type: "object" } },
			],
		}),
	);
	expect(result.score).toBe(0.5);
	expect(result.evidence).toContain("search_files");
});
