import { authorizationMetadata, stringList } from "../helpers/oauth.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class TokenAuthMethodsRule extends QualityRule {
	readonly id = "security.token-auth-methods";
	readonly category = "security" as const;
	readonly name = "Token endpoint authentication methods";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const metadata = authorizationMetadata(context);
		if (!metadata) return skipped("Authorization server metadata was unavailable");
		const methods = stringList(metadata.token_endpoint_auth_methods_supported);
		return result(methods.length > 0 ? 1 : 0, `Token auth methods: ${methods.join(", ") || "none"}`);
	}
}
