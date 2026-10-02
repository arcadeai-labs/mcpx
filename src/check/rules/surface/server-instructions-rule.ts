import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class ServerInstructionsRule extends QualityRule {
	readonly id = "surface.server-instructions";
	readonly category = "surface" as const;
	readonly name = "Server instructions";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const instructions = context.serverInfo.instructions?.trim() ?? "";
		return result(
			instructions.length > 0 ? 1 : 0,
			instructions.length > 0
				? "Initialize response includes server instructions"
				: "No server instructions were provided",
			"Provide concise routing and usage instructions in the initialize response",
		);
	}
}
