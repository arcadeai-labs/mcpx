import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

const SECRET_HEADER = /^(authorization|x-api-key|api-key)$/i;

export class AuthenticationRule extends QualityRule {
	readonly id = "security.authentication";
	readonly category = "security" as const;
	readonly name = "OAuth 2.0 or public access";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http) return skipped("Not applicable to stdio transport");
		const headers = "headers" in context.config ? context.config.headers : undefined;
		if (headers && Object.keys(headers).some((header) => SECRET_HEADER.test(header))) {
			return result(0, "Static credential header is configured", "Use MCP OAuth 2.0 instead of API keys");
		}
		if (context.http.oauth) return result(1, "OAuth protected-resource metadata was discovered");
		const status = context.http.unauthenticatedStatus;
		if (status !== undefined && status !== 401 && status !== 403) {
			return result(1, `Server is publicly reachable without credentials (HTTP ${status})`);
		}
		return result(
			0,
			status
				? `Authentication required (HTTP ${status}) but OAuth metadata was not discovered`
				: "Authentication mode is unknown",
			"Publish OAuth protected-resource metadata or allow public access",
		);
	}
}
