import { expect, test } from "bun:test";
import { PostContentTypeRule } from "../../../src/check/rules/protocol/post-content-type-rule.ts";
import { httpContext } from "./helpers.ts";

test("POST content type accepts JSON", async () => {
	const ctx = httpContext();
	ctx.http!.jsonRpcResult = { status: 200, headers: {}, contentType: "application/json" };
	expect((await new PostContentTypeRule().computeScore(ctx)).score).toBe(1);
});
