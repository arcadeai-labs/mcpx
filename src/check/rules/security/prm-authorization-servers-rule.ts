import { absoluteHttps } from "../helpers/oauth.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class PrmAuthorizationServersRule extends QualityRule {
	readonly id = "security.prm-authorization-servers";
	readonly category = "security" as const;
	readonly name = "Protected resource authorization servers";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.oauth) return skipped("No protected resource metadata was available");
		const servers = context.http.oauth.authorizationServerUrls ?? [];
		return result(
			servers.length > 0 && servers.every(absoluteHttps) ? 1 : 0,
			`${servers.length} authorization server URL(s) advertised`,
		);
	}
}
