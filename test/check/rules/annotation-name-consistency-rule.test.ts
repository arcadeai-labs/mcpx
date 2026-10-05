import { expect, test } from "bun:test";
import { AnnotationNameConsistencyRule } from "../../../src/check/rules/tool-quality/annotation-name-consistency-rule.ts";
import { context } from "./helpers.ts";

test("annotation consistency accepts matching hints", async () => {
	const result = await new AnnotationNameConsistencyRule().computeScore(
		context({
			tools: [
				{ name: "retrieve_doc", inputSchema: { type: "object" }, annotations: { readOnlyHint: true } },
				{
					name: "delete_doc",
					inputSchema: { type: "object" },
					annotations: { readOnlyHint: false, destructiveHint: true },
				},
			],
		}),
	);
	expect(result.score).toBe(1);
});

test("annotation consistency flags contradictions", async () => {
	const result = await new AnnotationNameConsistencyRule().computeScore(
		context({
			tools: [
				{ name: "create_issue", inputSchema: { type: "object" }, annotations: { readOnlyHint: true } },
				{ name: "remove_member", inputSchema: { type: "object" }, annotations: { destructiveHint: false } },
			],
		}),
	);
	expect(result.score).toBe(0);
});

test("annotation consistency skips unannotated tools", async () => {
	const result = await new AnnotationNameConsistencyRule().computeScore(
		context({ tools: [{ name: "get_user", inputSchema: { type: "object" } }] }),
	);
	expect(result.status).toBe("skip");
});
