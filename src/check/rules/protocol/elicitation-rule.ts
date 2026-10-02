import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class ElicitationRule extends QualityRule {
	readonly id = "protocol.elicitation";
	readonly category = "protocol" as const;
	readonly name = "Elicitation support";
	readonly weight = 2;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const evidence = JSON.stringify({
			capabilities: context.serverInfo.capabilities,
			tools: context.tools.map((tool) => ({ name: tool.name, description: tool.description })),
		}).toLowerCase();
		const supports = evidence.includes("elicitation") || evidence.includes("elicit");
		return result(
			supports ? 1 : 0,
			supports ? "Server surface advertises or references elicitation" : "No elicitation support was observable",
			"Use elicitation for server-initiated user input where appropriate",
		);
	}
}
