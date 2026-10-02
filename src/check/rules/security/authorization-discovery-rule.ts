import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class AuthorizationDiscoveryRule extends QualityRule {
	readonly id = "security.authorization-discovery";
	readonly category = "security" as const;
	readonly name = "Authorization server discovery";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.oauth) return skipped("No OAuth authorization server was advertised");
		const { rfc8414Status, oidcStatus } = context.http.oauth;
		const available = rfc8414Status === 200 || oidcStatus === 200;
		return result(
			available ? 1 : 0,
			`RFC 8414: HTTP ${rfc8414Status ?? "unknown"}; OIDC: HTTP ${oidcStatus ?? "unknown"}`,
		);
	}
}
