import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class WwwAuthenticateRule extends QualityRule {
	readonly id = "security.www-authenticate";
	readonly category = "security" as const;
	readonly name = "WWW-Authenticate challenge";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http) return skipped("Not applicable to stdio transport");
		if (context.http.unauthenticatedStatus !== 401) return skipped("Server did not issue an authentication challenge");
		return result(
			context.http.wwwAuthenticate ? 1 : 0,
			context.http.wwwAuthenticate ? "Challenge header is present" : "Challenge header is missing",
		);
	}
}
