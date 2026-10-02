import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class ToolCountRule extends QualityRule {
	readonly id = "surface.tool-count";
	readonly category = "surface" as const;
	readonly name = "Focused tool count";
	readonly weight = 6;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		return result(
			context.tools.length < 100 ? 1 : 0,
			`Server exposes ${context.tools.length} tools`,
			"Expose fewer than 100 coherent tools per server",
		);
	}
}
