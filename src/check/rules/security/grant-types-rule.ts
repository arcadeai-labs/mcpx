import { authorizationMetadata, stringList } from "../helpers/oauth.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class GrantTypesRule extends QualityRule {
	readonly id = "security.grant-types";
	readonly category = "security" as const;
	readonly name = "OAuth grant types";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const metadata = authorizationMetadata(context);
		if (!metadata) return skipped("Authorization server metadata was unavailable");
		const grants = stringList(metadata.grant_types_supported);
		const required = ["authorization_code", "refresh_token"];
		const score = required.filter((grant) => grants.includes(grant)).length / required.length;
		return result(score, `Supported grants: ${grants.join(", ") || "none"}`);
	}
}
