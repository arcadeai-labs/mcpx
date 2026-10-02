import { asObject } from "../helpers/schema.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class JsonRpcErrorRule extends QualityRule {
	readonly id = "protocol.json-rpc-error";
	readonly category = "protocol" as const;
	readonly name = "JSON-RPC error response";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const response = context.http?.jsonRpcError;
		if (!response) return skipped("Authenticated JSON-RPC error probe was unavailable");
		const body = asObject(response.body);
		const error = asObject(body?.error);
		const valid = body?.jsonrpc === "2.0" && typeof error?.code === "number" && typeof error.message === "string";
		return result(
			valid ? 1 : 0,
			valid ? "Unknown method returned a valid JSON-RPC error" : "Malformed JSON-RPC error response",
		);
	}
}
