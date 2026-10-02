import { expect, test } from "bun:test";
import { JsonRpcErrorRule } from "../../../src/check/rules/protocol/json-rpc-error-rule.ts";
import { httpContext } from "./helpers.ts";

test("JSON-RPC errors require a valid error object", async () => {
	const ctx = httpContext();
	ctx.http!.jsonRpcError = {
		status: 200,
		headers: {},
		body: { jsonrpc: "2.0", id: "error", error: { code: -32601, message: "Not found" } },
	};
	expect((await new JsonRpcErrorRule().computeScore(ctx)).score).toBe(1);
});
