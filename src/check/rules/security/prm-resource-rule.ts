import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class PrmResourceRule extends QualityRule {
	readonly id = "security.prm-resource";
	readonly category = "security" as const;
	readonly name = "Protected resource identifier";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http?.oauth) return skipped("No protected resource metadata was available");
		const resource = context.http.oauth.resource;
		let valid = false;
		if (resource) {
			try {
				const parsed = new URL(resource);
				const server = new URL(context.http.url);
				valid = parsed.protocol === "https:" && !parsed.hash && parsed.origin === server.origin;
			} catch {
				valid = false;
			}
		}
		return result(valid ? 1 : 0, resource ? `Resource identifier: ${resource}` : "Resource identifier is missing");
	}
}
