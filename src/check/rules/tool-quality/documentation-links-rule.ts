import { ratio } from "../helpers/schema.ts";
import { URL_PATTERN } from "../helpers/text.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class DocumentationLinksRule extends QualityRule {
	readonly id = "tool-quality.documentation-links";
	readonly category = "tool-quality" as const;
	readonly name = "Documentation links";
	readonly weight = 3;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const linked = context.tools.filter((tool) => URL_PATTERN.test(tool.description ?? "")).length;
		return result(
			ratio(linked, context.tools.length),
			`${linked}/${context.tools.length} tool descriptions link to documentation`,
			"Link to relevant product or API documentation in tool descriptions",
		);
	}
}
