import { absoluteHttps, authorizationMetadata } from "../helpers/oauth.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class AsEndpointsRule extends QualityRule {
	readonly id = "security.as-endpoints";
	readonly category = "security" as const;
	readonly name = "Authorization and token endpoints";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const metadata = authorizationMetadata(context);
		if (!metadata) return skipped("Authorization server metadata was unavailable");
		const authorization = absoluteHttps(metadata.authorization_endpoint);
		const token = absoluteHttps(metadata.token_endpoint);
		return result(
			(Number(authorization) + Number(token)) / 2,
			`authorization_endpoint ${authorization ? "valid" : "invalid"}; token_endpoint ${token ? "valid" : "invalid"}`,
		);
	}
}
