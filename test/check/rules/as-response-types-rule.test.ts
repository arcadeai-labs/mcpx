import { expect, test } from "bun:test";
import { AsResponseTypesRule } from "../../../src/check/rules/security/as-response-types-rule.ts";
import { httpContext } from "./helpers.ts";

test("authorization server supports code response type", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { authorizationServerMetadata: { response_types_supported: ["code"] } };
	expect((await new AsResponseTypesRule().computeScore(ctx)).score).toBe(1);
});
