import { expect, test } from "bun:test";
import { DocumentationLinksRule } from "../../../src/check/rules/tool-quality/documentation-links-rule.ts";
import { context } from "./helpers.ts";

test("documentation links recognizes HTTPS URLs", async () => {
	const result = await new DocumentationLinksRule().computeScore(
		context({
			tools: [{ name: "status", description: "See https://example.com/docs", inputSchema: {} }],
		}),
	);
	expect(result.score).toBe(1);
});
