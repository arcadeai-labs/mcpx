import { asObject } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class JsonRpcResultRule extends QualityRule {
	readonly id = "protocol.json-rpc-result";
	readonly category = "protocol" as const;
	readonly name = "JSON-RPC result response";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const response = context.http?.jsonRpcResult;
		if (!response) return skipped("Authenticated raw JSON-RPC result probe was unavailable");
		const body = asObject(response.body);
		const valid = response.status === 200 && body?.jsonrpc === "2.0" && "result" in (body ?? {});
		return result(valid ? 1 : 0, `Ping result returned HTTP ${response.status}`);
	}
}
