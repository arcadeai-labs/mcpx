import { absoluteHttps, authorizationMetadata } from "../helpers/oauth.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class AsIssuerRule extends QualityRule {
	readonly id = "security.as-issuer";
	readonly category = "security" as const;
	readonly name = "Authorization server issuer";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const metadata = authorizationMetadata(context);
		if (!metadata) return skipped("Authorization server metadata was unavailable");
		return result(absoluteHttps(metadata.issuer) ? 1 : 0, `Issuer: ${String(metadata.issuer ?? "missing")}`);
	}
}
