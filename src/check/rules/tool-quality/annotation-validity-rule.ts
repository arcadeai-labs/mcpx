import { toolAnnotations } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const ALLOWED = new Set(["title", "readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"]);

export class AnnotationValidityRule extends QualityRule {
	readonly id = "tool-quality.annotation-validity";
	readonly category = "tool-quality" as const;
	readonly name = "Tool annotation validity";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const annotated = context.tools.flatMap((tool) => {
			const annotations = toolAnnotations(tool);
			return annotations ? [{ tool: tool.name, annotations }] : [];
		});
		if (annotated.length === 0) return skipped("No tools expose annotations");
		const valid = annotated.filter(({ annotations }) => {
			if (Object.keys(annotations).some((key) => !ALLOWED.has(key))) return false;
			if (annotations.readOnlyHint === true && annotations.destructiveHint === true) return false;
			return Object.entries(annotations).every(([key, value]) =>
				key === "title" ? typeof value === "string" : typeof value === "boolean",
			);
		}).length;
		return result(
			valid / annotated.length,
			`${valid}/${annotated.length} annotated tools use recognized, consistent hints`,
		);
	}
}
