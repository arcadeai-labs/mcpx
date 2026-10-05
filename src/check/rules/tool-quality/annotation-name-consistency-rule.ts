import { examples, toolVerb } from "../helpers/naming.ts";
import { toolAnnotations } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class AnnotationNameConsistencyRule extends QualityRule {
	readonly id = "tool-quality.annotation-name-consistency";
	readonly category = "tool-quality" as const;
	readonly name = "Annotations match tool names";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		let assessed = 0;
		const mismatched: string[] = [];
		for (const tool of context.tools) {
			const verb = toolVerb(tool.name);
			const annotations = toolAnnotations(tool);
			if (!verb || verb.intent === "neutral" || !annotations) continue;
			const { readOnlyHint, destructiveHint } = annotations;
			if (typeof readOnlyHint !== "boolean" && typeof destructiveHint !== "boolean") continue;
			assessed++;
			const contradicts =
				(verb.intent === "read" && readOnlyHint === false) ||
				(verb.intent === "write" && readOnlyHint === true) ||
				(verb.intent === "destructive" && (readOnlyHint === true || destructiveHint === false));
			if (contradicts) mismatched.push(`${tool.name} (${verb.verb})`);
		}
		if (assessed === 0) return skipped("No tools pair a recognized verb with behavior annotations");
		return result(
			(assessed - mismatched.length) / assessed,
			mismatched.length === 0
				? `${assessed} annotated tools have hints that match their name's verb`
				: `${mismatched.length}/${assessed} annotated tools contradict their name's verb: ${examples(mismatched)}`,
			"Mark read verbs (get, list, search, fetch…) readOnlyHint: true and delete/remove verbs destructiveHint: true",
		);
	}
}
