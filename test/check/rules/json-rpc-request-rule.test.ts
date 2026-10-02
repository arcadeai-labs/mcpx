import { expect, test } from "bun:test";
import { JsonRpcRequestRule } from "../../../src/check/rules/protocol/json-rpc-request-rule.ts";
import { httpContext } from "./helpers.ts";

test("JSON-RPC request validation requires -32600", async () => {
	const ctx = httpContext();
	ctx.http!.invalidJsonRpc = { status: 400, headers: {}, body: { jsonrpc: "2.0", id: null, error: { code: -32600 } } };
	expect((await new JsonRpcRequestRule().computeScore(ctx)).score).toBe(1);
});
