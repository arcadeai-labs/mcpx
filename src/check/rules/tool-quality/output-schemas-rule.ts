import { asObject, ratio, toolRecord } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class OutputSchemasRule extends QualityRule {
	readonly id = "tool-quality.output-schemas";
	readonly category = "tool-quality" as const;
	readonly name = "Typed tool responses";
	readonly weight = 6;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const typed = context.tools.filter((tool) => asObject(toolRecord(tool).outputSchema)).length;
		return result(
			ratio(typed, context.tools.length),
			`${typed}/${context.tools.length} tools define outputSchema`,
			"Define outputSchema and return matching structuredContent",
		);
	}
}
