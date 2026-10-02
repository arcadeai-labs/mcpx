import { ratio } from "../helpers/schema.ts";
import { mentionsAny } from "../helpers/text.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

const WHEN_WORDS = ["when ", "use ", "for "];
const RETURN_WORDS = ["return", "result", "response", "output"];
const CHANGE_WORDS = ["read", "create", "update", "delete", "send", "change", "list", "search", "retrieve"];

export class DescriptionContentRule extends QualityRule {
	readonly id = "tool-quality.description-content";
	readonly category = "tool-quality" as const;
	readonly name = "Actionable description content";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		let passed = 0;
		const total = context.tools.length * 3;
		for (const tool of context.tools) {
			const description = tool.description ?? "";
			if (mentionsAny(description, WHEN_WORDS)) passed++;
			if (mentionsAny(description, RETURN_WORDS)) passed++;
			if (mentionsAny(description, CHANGE_WORDS)) passed++;
		}
		return result(
			ratio(passed, total),
			`${passed}/${total} purpose, usage, and output description signals found`,
			"Describe what each tool changes, what it returns, and when to use it",
		);
	}
}
