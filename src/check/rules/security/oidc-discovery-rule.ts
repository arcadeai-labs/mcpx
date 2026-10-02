import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class OidcDiscoveryRule extends QualityRule {
	readonly id = "security.oidc-discovery";
	readonly category = "security" as const;
	readonly name = "OpenID Connect discovery";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.oauth) return skipped("No OAuth authorization server was advertised");
		if (context.http.oauth.oidcStatus === 404) return skipped("OIDC discovery is optional when RFC 8414 is available");
		return result(
			context.http.oauth.oidcStatus === 200 ? 1 : 0,
			`OIDC endpoint returned HTTP ${context.http.oauth.oidcStatus ?? "unknown"}`,
		);
	}
}
