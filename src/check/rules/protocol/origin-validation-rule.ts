import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class OriginValidationRule extends QualityRule {
	readonly id = "protocol.origin-validation";
	readonly category = "protocol" as const;
	readonly name = "Origin validation";
	readonly weight = 2;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http) return skipped("Not applicable to stdio transport");
		const status = context.http.originStatus;
		if (status === undefined || status === 401) return skipped("Origin behavior was obscured by authentication");
		if (status === 403) return result(1, "Hostile Origin header was rejected with HTTP 403");
		if (status >= 200 && status < 300) {
			return result(0, `Hostile Origin header was accepted (HTTP ${status})`, "Reject untrusted Origin headers");
		}
		return result(0.5, `Hostile Origin request returned HTTP ${status}; rejection was inconclusive`);
	}
}
