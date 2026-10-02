import { expect, test } from "bun:test";
import { JsonRpcResultRule } from "../../../src/check/rules/protocol/json-rpc-result-rule.ts";
import { httpContext } from "./helpers.ts";

test("JSON-RPC result validates the response envelope", async () => {
	const ctx = httpContext();
	ctx.http!.jsonRpcResult = { status: 200, headers: {}, body: { jsonrpc: "2.0", id: "result", result: {} } };
	expect((await new JsonRpcResultRule().computeScore(ctx)).score).toBe(1);
});
