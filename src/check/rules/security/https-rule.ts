import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class HttpsRule extends QualityRule {
	readonly id = "security.https";
	readonly category = "security" as const;
	readonly name = "HTTPS transport";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http) return skipped("Not applicable to stdio transport");
		const secure = new URL(context.http.url).protocol === "https:";
		return result(
			secure ? 1 : 0,
			secure ? "Endpoint uses HTTPS" : "Endpoint uses plaintext HTTP",
			"Serve MCP over HTTPS",
		);
	}
}
