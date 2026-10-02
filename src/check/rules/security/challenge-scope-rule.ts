import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const SCOPE_TOKEN = /^[\x21\x23-\x5B\x5D-\x7E]+$/;

export class ChallengeScopeRule extends QualityRule {
	readonly id = "security.challenge-scope";
	readonly category = "security" as const;
	readonly name = "Challenge scope guidance";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.challenge) return skipped("No authentication challenge was available");
		const scope = context.http.challenge.params.scope;
		const tokens = scope?.split(" ").filter(Boolean) ?? [];
		const valid = tokens.length > 0 && tokens.every((token) => SCOPE_TOKEN.test(token));
		return result(valid ? 1 : 0, scope ? `Challenge scope: ${scope}` : "Challenge does not recommend a scope");
	}
}
