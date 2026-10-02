import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class ProtocolHeaderRule extends QualityRule {
	readonly id = "protocol.version-header";
	readonly category = "protocol" as const;
	readonly name = "Protocol version header validation";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const response = context.http?.invalidProtocolVersion;
		if (!response) return skipped("Raw HTTP protocol-header validation is unavailable");
		const rejected = response.status === 400;
		return result(rejected ? 1 : 0, `Invalid MCP-Protocol-Version returned HTTP ${response.status}`);
	}
}
