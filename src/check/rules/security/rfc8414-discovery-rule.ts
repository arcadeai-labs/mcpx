import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class Rfc8414DiscoveryRule extends QualityRule {
	readonly id = "security.rfc8414-discovery";
	readonly category = "security" as const;
	readonly name = "RFC 8414 discovery";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.oauth) return skipped("No OAuth authorization server was advertised");
		return result(
			context.http.oauth.rfc8414Status === 200 ? 1 : 0,
			`RFC 8414 endpoint returned HTTP ${context.http.oauth.rfc8414Status ?? "unknown"}`,
		);
	}
}
