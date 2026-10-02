import { ratio } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class ActionableErrorsRule extends QualityRule {
	readonly id = "tool-quality.actionable-errors";
	readonly category = "tool-quality" as const;
	readonly name = "Actionable validation errors";
	readonly weight = 5;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.probesEnabled) return skipped("Error probes were disabled");
		if (context.probes.length === 0) return skipped("No safely probeable read-only tools were available");
		const actionable = context.probes.filter((probe) => probe.actionable).length;
		return result(
			ratio(actionable, context.probes.length),
			`${actionable}/${context.probes.length} invalid calls returned actionable errors`,
			"Return a tool error or -32602 that names the invalid field and avoids stack traces",
		);
	}
}
