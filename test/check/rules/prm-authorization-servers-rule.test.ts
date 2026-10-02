import { expect, test } from "bun:test";
import { PrmAuthorizationServersRule } from "../../../src/check/rules/security/prm-authorization-servers-rule.ts";
import { httpContext } from "./helpers.ts";

test("protected resource advertises HTTPS authorization servers", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { authorizationServerUrls: ["https://auth.example.com"] };
	expect((await new PrmAuthorizationServersRule().computeScore(ctx)).score).toBe(1);
});
