import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class SessionTerminationRule extends QualityRule {
	readonly id = "protocol.session-termination";
	readonly category = "protocol" as const;
	readonly name = "Session termination";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const response = context.http?.sessionTermination;
		if (!context.http) return skipped("Not applicable to stdio transport");
		if (!response) return skipped("Server is stateless or did not establish a probe session");
		return result(
			response.status >= 200 && response.status < 300 ? 1 : 0,
			`DELETE session returned HTTP ${response.status}`,
		);
	}
}
