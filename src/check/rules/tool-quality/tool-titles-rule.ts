import { ratio, toolAnnotations, toolRecord } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class ToolTitlesRule extends QualityRule {
	readonly id = "tool-quality.titles";
	readonly category = "tool-quality" as const;
	readonly name = "Human-readable tool titles";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const titled = context.tools.filter((tool) => {
			const title = toolRecord(tool).title ?? toolAnnotations(tool)?.title;
			return typeof title === "string" && title.trim().length > 0;
		}).length;
		return result(
			ratio(titled, context.tools.length),
			`${titled}/${context.tools.length} tools have titles`,
			"Add a human-readable title to each tool",
		);
	}
}
