import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class PostContentTypeRule extends QualityRule {
	readonly id = "protocol.post-content-type";
	readonly category = "protocol" as const;
	readonly name = "POST response content type";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const response = context.http?.jsonRpcResult;
		if (!response) return skipped("Authenticated POST probe was unavailable");
		const contentType = response.contentType ?? "";
		const valid = contentType.includes("application/json") || contentType.includes("text/event-stream");
		return result(valid ? 1 : 0, `POST response content type: ${contentType || "missing"}`);
	}
}
