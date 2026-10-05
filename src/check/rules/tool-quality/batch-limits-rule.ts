import { examples } from "../helpers/naming.ts";
import { schemaTypes, toolParameters } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class BatchLimitsRule extends QualityRule {
	readonly id = "tool-quality.batch-limits";
	readonly category = "tool-quality" as const;
	readonly name = "Bounded array inputs";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const arrays = toolParameters(context.tools).filter(({ schema }) => schemaTypes(schema).includes("array"));
		if (arrays.length === 0) return skipped("No array parameters were found");
		const unbounded = arrays
			.filter(({ schema }) => typeof schema.maxItems !== "number")
			.map(({ tool, name }) => `${tool}.${name}`);
		return result(
			(arrays.length - unbounded.length) / arrays.length,
			unbounded.length === 0
				? `${arrays.length} array parameters declare maxItems`
				: `${unbounded.length}/${arrays.length} array parameters have no maxItems: ${examples(unbounded)}`,
			"Set maxItems on array parameters so agents know the batch size limit",
		);
	}
}
