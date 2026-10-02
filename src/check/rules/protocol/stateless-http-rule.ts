import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class StatelessHttpRule extends QualityRule {
	readonly id = "protocol.stateless-http";
	readonly category = "protocol" as const;
	readonly name = "Stateless Streamable HTTP";
	readonly weight = 4;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http) return skipped("Not applicable to stdio transport");
		if (context.http.transport === "sse") {
			return result(0, "Server uses deprecated HTTP+SSE transport", "Use stateless Streamable HTTP");
		}
		if (context.serverInfo.sessionId) {
			return result(0.5, "Streamable HTTP works but requires Mcp-Session-Id", "Support stateless requests");
		}
		return result(1, "Streamable HTTP works without a session id");
	}
}
