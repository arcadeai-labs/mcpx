import { countToolProperties, hasType, propertiesOf, ratio } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class TypedParametersRule extends QualityRule {
	readonly id = "tool-quality.typed-parameters";
	readonly category = "tool-quality" as const;
	readonly name = "Typed tool parameters";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const total = countToolProperties(context.tools);
		const typed = context.tools.reduce(
			(sum, tool) => sum + Object.values(propertiesOf(tool)).filter(hasType).length,
			0,
		);
		return result(ratio(typed, total), `${typed}/${total} parameters have explicit types`, "Type every tool parameter");
	}
}
