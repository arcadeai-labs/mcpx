import { ratio, toolAnnotations } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

const HINTS = ["readOnlyHint", "destructiveHint", "idempotentHint", "openWorldHint"] as const;

export class ToolAnnotationsRule extends QualityRule {
	readonly id = "protocol.tool-annotations";
	readonly category = "protocol" as const;
	readonly name = "Tool behavior annotations";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		let present = 0;
		const total = context.tools.length * HINTS.length;
		for (const tool of context.tools) {
			const annotations = toolAnnotations(tool);
			for (const hint of HINTS) if (typeof annotations?.[hint] === "boolean") present++;
		}
		return result(
			ratio(present, total),
			`${present}/${total} behavior hints are explicitly declared`,
			"Declare readOnlyHint, destructiveHint, idempotentHint, and openWorldHint on every tool",
		);
	}
}
