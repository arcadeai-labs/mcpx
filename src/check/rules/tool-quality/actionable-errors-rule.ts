import { ratio } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class ActionableErrorsRule extends QualityRule {
	readonly id = "tool-quality.actionable-errors";
	readonly category = "tool-quality" as const;
	readonly name = "Actionable validation errors";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.probesEnabled) return skipped("Error probes were disabled");
		if (context.probes.length === 0) return skipped("No safely probeable read-only tools were available");
		const errors = context.probes.filter((probe) => probe.isError);
		if (errors.length === 0) return skipped("Probe calls did not produce errors to assess");
		const actionable = errors.filter((probe) => probe.actionable).length;
		return result(
			ratio(actionable, errors.length),
			`${actionable}/${errors.length} errors were actionable`,
			"Return a tool error or -32602 that names the invalid field and avoids stack traces",
		);
	}
}
