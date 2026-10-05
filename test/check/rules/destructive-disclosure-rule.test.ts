import { expect, test } from "bun:test";
import { DestructiveDisclosureRule } from "../../../src/check/rules/tool-quality/destructive-disclosure-rule.ts";
import { context } from "./helpers.ts";

test("destructive disclosure requires a permanence warning", async () => {
	const result = await new DestructiveDisclosureRule().computeScore(
		context({
			tools: [
				{
					name: "delete_file",
					description: "Permanently deletes a file. This cannot be undone.",
					inputSchema: { type: "object" },
				},
				{
					name: "wipe_cache",
					description: "Clears the cache.",
					inputSchema: { type: "object" },
					annotations: { destructiveHint: true },
				},
			],
		}),
	);
	expect(result.score).toBe(0.5);
	expect(result.evidence).toContain("wipe_cache");
});

test("destructive disclosure skips servers without destructive tools", async () => {
	const result = await new DestructiveDisclosureRule().computeScore(
		context({ tools: [{ name: "get_file", inputSchema: { type: "object" } }] }),
	);
	expect(result.status).toBe("skip");
});
