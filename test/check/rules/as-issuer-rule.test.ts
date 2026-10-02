import { expect, test } from "bun:test";
import { AsIssuerRule } from "../../../src/check/rules/security/as-issuer-rule.ts";
import { httpContext } from "./helpers.ts";

test("authorization server issuer is HTTPS", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { authorizationServerMetadata: { issuer: "https://auth.example.com" } };
	expect((await new AsIssuerRule().computeScore(ctx)).score).toBe(1);
});
