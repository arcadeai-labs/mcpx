import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class PrmDiscoveryRule extends QualityRule {
	readonly id = "security.prm-discovery";
	readonly category = "security" as const;
	readonly name = "Protected resource metadata discovery";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http) return skipped("Not applicable to stdio transport");
		if (context.http.unauthenticatedStatus !== 401 && !context.http.oauth) return skipped("Server is public");
		const oauth = context.http.oauth;
		const valid = oauth?.resourceMetadataStatus === 200 && oauth.resourceMetadata !== undefined;
		return result(
			valid ? 1 : 0,
			`Protected resource metadata returned HTTP ${oauth?.resourceMetadataStatus ?? "unknown"}`,
		);
	}
}
