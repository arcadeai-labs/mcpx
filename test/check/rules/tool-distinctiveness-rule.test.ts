import { expect, test } from "bun:test";
import { ToolDistinctivenessRule } from "../../../src/check/rules/surface/tool-distinctiveness-rule.ts";
import { context } from "./helpers.ts";

test("tool distinctiveness flags near-duplicate descriptions and name collisions", async () => {
	const result = await new ToolDistinctivenessRule().computeScore(
		context({
			tools: [
				{
					name: "search_docs",
					description: "Search documents in the workspace by keyword.",
					inputSchema: { type: "object" },
				},
				{
					name: "find_docs",
					description: "Search documents in workspace by keywords.",
					inputSchema: { type: "object" },
				},
				{ name: "get_user", description: "Get a user profile by email address.", inputSchema: { type: "object" } },
				{ name: "getUser", description: "Fetch account details and permissions.", inputSchema: { type: "object" } },
				{ name: "send_email", description: "Send an email message to recipients.", inputSchema: { type: "object" } },
			],
		}),
	);
	expect(result.score).toBeCloseTo(1 / 5);
	expect(result.evidence).toContain("search_docs ~ find_docs");
	expect(result.evidence).toContain("get_user ~ getUser");
});
