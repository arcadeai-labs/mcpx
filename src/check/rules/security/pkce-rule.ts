import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class PkceRule extends QualityRule {
	readonly id = "security.pkce";
	readonly category = "security" as const;
	readonly name = "PKCE support";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.oauth) return skipped("Public or non-HTTP server does not require PKCE");
		const methods = context.http.oauth.codeChallengeMethodsSupported ?? [];
		const supportsS256 = methods.includes("S256");
		return result(
			supportsS256 ? 1 : 0,
			supportsS256 ? "Authorization server advertises PKCE S256" : "PKCE S256 was not advertised",
			"Advertise code_challenge_methods_supported with S256",
		);
	}
}
