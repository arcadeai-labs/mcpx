import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class InvalidTokenRule extends QualityRule {
	readonly id = "security.invalid-token";
	readonly category = "security" as const;
	readonly name = "Invalid token rejection";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.oauth) return skipped("Public or non-HTTP server does not use bearer tokens");
		const status = context.http.invalidTokenStatus;
		return result(status === 401 ? 1 : 0, `Synthetic invalid bearer token returned HTTP ${status ?? "unknown"}`);
	}
}
