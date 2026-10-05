import { expect, test } from "bun:test";
import { UnsafeDefaultsRule } from "../../../src/check/rules/tool-quality/unsafe-defaults-rule.ts";
import { context } from "./helpers.ts";

test("unsafe defaults flags risky flags that default to true", async () => {
	const result = await new UnsafeDefaultsRule().computeScore(
		context({
			tools: [
				{
					name: "sync_files",
					inputSchema: {
						type: "object",
						properties: {
							overwrite: { type: "boolean", default: true },
							skip_confirmation: { type: "boolean", default: false },
							verbose: { type: "boolean", default: true },
						},
					},
				},
			],
		}),
	);
	expect(result.score).toBe(0.5);
	expect(result.evidence).toContain("sync_files.overwrite");
});
