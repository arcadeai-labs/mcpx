import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class BearerChallengeRule extends QualityRule {
	readonly id = "security.bearer-challenge";
	readonly category = "security" as const;
	readonly name = "Bearer authentication scheme";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.challenge) return skipped("No authentication challenge was available");
		const bearer = context.http.challenge.scheme?.toLowerCase() === "bearer";
		return result(
			bearer ? 1 : 0,
			bearer ? "Challenge uses Bearer" : `Challenge uses ${context.http.challenge.scheme ?? "unknown"}`,
		);
	}
}
