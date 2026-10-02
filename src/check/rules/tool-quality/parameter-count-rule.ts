import { propertiesOf } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class ParameterCountRule extends QualityRule {
	readonly id = "tool-quality.parameter-count";
	readonly category = "tool-quality" as const;
	readonly name = "Tool parameter count";
	readonly weight = 3;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const total = context.tools.reduce((sum, tool) => sum + Object.keys(propertiesOf(tool)).length, 0);
		const average = context.tools.length === 0 ? 0 : total / context.tools.length;
		return result(
			average < 8 ? 1 : 0,
			`Tools average ${average.toFixed(1)} parameters`,
			"Keep tools focused and below 8 parameters on average",
		);
	}
}
