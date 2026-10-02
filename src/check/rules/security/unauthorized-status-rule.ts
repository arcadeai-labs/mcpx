import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class UnauthorizedStatusRule extends QualityRule {
	readonly id = "security.unauthorized-status";
	readonly category = "security" as const;
	readonly name = "Unauthenticated request status";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http) return skipped("Not applicable to stdio transport");
		if (context.http.oauth === undefined && context.http.unauthenticatedStatus !== 401)
			return skipped("Server is public");
		return result(
			context.http.unauthenticatedStatus === 401 ? 1 : 0,
			`Unauthenticated request returned HTTP ${context.http.unauthenticatedStatus ?? "unknown"}`,
		);
	}
}
