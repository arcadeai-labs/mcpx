import { countToolProperties, hasConstraint, propertiesOf, ratio } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class InputConstraintsRule extends QualityRule {
	readonly id = "tool-quality.input-constraints";
	readonly category = "tool-quality" as const;
	readonly name = "Input constraints";
	readonly weight = 3;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const total = countToolProperties(context.tools);
		const constrained = context.tools.reduce(
			(sum, tool) => sum + Object.values(propertiesOf(tool)).filter(hasConstraint).length,
			0,
		);
		return result(
			ratio(constrained, total),
			`${constrained}/${total} parameters use enums, formats, patterns, or ranges`,
			"Constrain parameters where valid values are bounded",
		);
	}
}
