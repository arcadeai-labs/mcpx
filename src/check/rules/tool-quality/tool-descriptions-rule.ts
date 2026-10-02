import { ratio } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class ToolDescriptionsRule extends QualityRule {
	readonly id = "tool-quality.descriptions";
	readonly category = "tool-quality" as const;
	readonly name = "Tool descriptions";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const described = context.tools.filter((tool) => (tool.description?.trim().length ?? 0) > 0).length;
		return result(
			ratio(described, context.tools.length),
			`${described}/${context.tools.length} tools have descriptions`,
			"Add a clear description to every tool",
		);
	}
}
