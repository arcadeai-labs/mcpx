import { expect, test } from "bun:test";
import { WwwAuthenticateRule } from "../../../src/check/rules/security/www-authenticate-rule.ts";
import { httpContext } from "./helpers.ts";

test("401 includes WWW-Authenticate", async () => {
	const ctx = httpContext();
	ctx.http!.unauthenticatedStatus = 401;
	ctx.http!.wwwAuthenticate = "Bearer";
	expect((await new WwwAuthenticateRule().computeScore(ctx)).score).toBe(1);
});
