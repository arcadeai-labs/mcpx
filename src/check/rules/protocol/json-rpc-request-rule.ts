import { asObject } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class JsonRpcRequestRule extends QualityRule {
	readonly id = "protocol.json-rpc-request";
	readonly category = "protocol" as const;
	readonly name = "JSON-RPC request validation";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const response = context.http?.invalidJsonRpc;
		if (!response) return skipped("Raw HTTP request validation is unavailable");
		const error = asObject(asObject(response.body)?.error);
		const valid = response.status === 400 && error?.code === -32600 && asObject(response.body)?.id === null;
		return result(
			valid ? 1 : 0,
			`Invalid JSON-RPC request returned HTTP ${response.status}${error?.code ? ` / ${error.code}` : ""}`,
		);
	}
}
