import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class PrmScopesRule extends QualityRule {
	readonly id = "security.prm-scopes";
	readonly category = "security" as const;
	readonly name = "Protected resource scopes";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.oauth) return skipped("No protected resource metadata was available");
		const raw = context.http.oauth.resourceMetadata?.scopes_supported;
		if (raw === undefined) return skipped("Protected resource metadata does not declare optional scopes");
		const valid = Array.isArray(raw) && raw.every((scope) => typeof scope === "string");
		return result(valid ? 1 : 0, valid ? `${raw.length} valid scope(s)` : "scopes_supported is malformed");
	}
}
