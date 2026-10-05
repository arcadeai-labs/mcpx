import { expect, test } from "bun:test";
import { NamingRule } from "../../../src/check/rules/tool-quality/naming-rule.ts";
import { context } from "./helpers.ts";

const schema = { type: "object" } as const;

test("naming passes verb-led names in one style, including read synonyms", async () => {
	const result = await new NamingRule().computeScore(
		context({
			tools: ["fetch_page", "lookup_user", "send_message", "search"].map((name) => ({ name, inputSchema: schema })),
		}),
	);
	expect(result.score).toBe(1);
});

test("naming penalizes verbless, invalid, and mixed-style names", async () => {
	const result = await new NamingRule().computeScore(
		context({
			tools: ["get_user", "list_teams", "userProfile", "bad name!"].map((name) => ({ name, inputSchema: schema })),
		}),
	);
	expect(result.status).toBe("warn");
	expect(result.evidence).toContain("no action verb");
	expect(result.evidence).toContain("invalid characters");
	expect(result.evidence).toContain("not snake_case");
});
