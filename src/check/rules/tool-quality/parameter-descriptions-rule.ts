import { countToolProperties, propertiesOf, ratio } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class ParameterDescriptionsRule extends QualityRule {
	readonly id = "tool-quality.parameter-descriptions";
	readonly category = "tool-quality" as const;
	readonly name = "Parameter descriptions";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const total = countToolProperties(context.tools);
		const described = context.tools.reduce(
			(sum, tool) =>
				sum +
				Object.values(propertiesOf(tool)).filter(
					(property) => typeof property.description === "string" && property.description.trim().length > 0,
				).length,
			0,
		);
		return result(
			ratio(described, total),
			`${described}/${total} parameters have descriptions`,
			"Describe every tool parameter",
		);
	}
}
