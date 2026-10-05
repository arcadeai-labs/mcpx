import { expect, test } from "bun:test";
import { EnumInProseRule } from "../../../src/check/rules/tool-quality/enum-in-prose-rule.ts";
import { context } from "./helpers.ts";

test("enum in prose flags choices listed only in descriptions", async () => {
	const result = await new EnumInProseRule().computeScore(
		context({
			tools: [
				{
					name: "list_items",
					inputSchema: {
						type: "object",
						properties: {
							order: { type: "string", description: "Sort order: 'asc' or 'desc'." },
							state: { type: "string", enum: ["open", "closed"] },
						},
					},
				},
			],
		}),
	);
	expect(result.score).toBe(0.5);
	expect(result.evidence).toContain("list_items.order");
});

test("enum in prose ignores quoted examples", async () => {
	const result = await new EnumInProseRule().computeScore(
		context({
			tools: [
				{
					name: "push_files",
					inputSchema: {
						type: "object",
						properties: { branch: { type: "string", description: "Branch to push to (e.g., 'main' or 'master')" } },
					},
				},
			],
		}),
	);
	expect(result.status).toBe("skip");
});
