import { authorizationMetadata, stringList } from "../helpers/oauth.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class AsResponseTypesRule extends QualityRule {
	readonly id = "security.as-response-types";
	readonly category = "security" as const;
	readonly name = "Authorization code response type";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const metadata = authorizationMetadata(context);
		if (!metadata) return skipped("Authorization server metadata was unavailable");
		const types = stringList(metadata.response_types_supported);
		return result(types.includes("code") ? 1 : 0, `Supported response types: ${types.join(", ") || "none"}`);
	}
}
