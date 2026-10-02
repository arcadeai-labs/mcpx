import { authorizationMetadata, stringList } from "../helpers/oauth.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class ClientCredentialsRule extends QualityRule {
	readonly id = "security.client-credentials";
	readonly category = "security" as const;
	readonly name = "Client credentials readiness";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const metadata = authorizationMetadata(context);
		if (!metadata) return skipped("Authorization server metadata was unavailable");
		const grants = stringList(metadata.grant_types_supported);
		if (!grants.includes("client_credentials")) return skipped("Client credentials is optional");
		return result(1, "Authorization server advertises client_credentials");
	}
}
