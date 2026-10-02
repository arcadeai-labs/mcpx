import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class ScopesRule extends QualityRule {
	readonly id = "security.scopes";
	readonly category = "security" as const;
	readonly name = "OAuth scopes";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.oauth) return skipped("Public or non-HTTP server does not require OAuth scopes");
		const scopes = context.http.oauth.scopesSupported ?? [];
		return result(
			scopes.length > 0 ? 1 : 0,
			scopes.length > 0 ? `${scopes.length} supported scope(s) advertised` : "No supported scopes advertised",
			"Advertise least-privilege scopes in authorization-server metadata",
		);
	}
}
