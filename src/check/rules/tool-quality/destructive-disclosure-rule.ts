import { examples, toolVerb } from "../helpers/naming.ts";
import { toolAnnotations } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const DISCLOSURE =
	/(permanent|irreversib|irrevocab|cannot be (undone|reversed|recovered)|can't be (undone|reversed|recovered)|unrecoverable|no undo|destructive|forever)/i;

export class DestructiveDisclosureRule extends QualityRule {
	readonly id = "tool-quality.destructive-disclosure";
	readonly category = "tool-quality" as const;
	readonly name = "Destructive effects disclosed";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const destructive = context.tools.filter((tool) => {
			const annotations = toolAnnotations(tool);
			if (annotations?.destructiveHint === true) return true;
			if (annotations?.readOnlyHint === true || annotations?.destructiveHint === false) return false;
			return toolVerb(tool.name)?.intent === "destructive";
		});
		if (destructive.length === 0) return skipped("No destructive tools were identified");
		const undisclosed = destructive.filter((tool) => !DISCLOSURE.test(tool.description ?? "")).map((tool) => tool.name);
		return result(
			(destructive.length - undisclosed.length) / destructive.length,
			undisclosed.length === 0
				? `${destructive.length} destructive tools state that their effects are permanent`
				: `${undisclosed.length}/${destructive.length} destructive tools do not warn about permanence: ${examples(undisclosed)}`,
			'State in the description when an operation is permanent (e.g., "Permanently deletes… cannot be undone")',
		);
	}
}
