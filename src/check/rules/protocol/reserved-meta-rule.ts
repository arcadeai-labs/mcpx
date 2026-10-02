import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class ReservedMetaRule extends QualityRule {
	readonly id = "protocol.reserved-meta";
	readonly category = "protocol" as const;
	readonly name = "Reserved _meta field acceptance";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const response = context.http?.reservedMeta;
		if (!response) return skipped("Authenticated _meta probe was unavailable");
		return result(response.status === 200 ? 1 : 0, `_meta request returned HTTP ${response.status}`);
	}
}
