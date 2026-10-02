import { absoluteHttps } from "../helpers/oauth.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class ChallengeResourceMetadataRule extends QualityRule {
	readonly id = "security.challenge-resource-metadata";
	readonly category = "security" as const;
	readonly name = "Challenge resource metadata URL";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.challenge) return skipped("No authentication challenge was available");
		const value = context.http.challenge.params.resource_metadata;
		return result(absoluteHttps(value) ? 1 : 0, value ? `resource_metadata=${value}` : "resource_metadata is missing");
	}
}
