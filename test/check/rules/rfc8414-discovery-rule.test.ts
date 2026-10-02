import { expect, test } from "bun:test";
import { Rfc8414DiscoveryRule } from "../../../src/check/rules/security/rfc8414-discovery-rule.ts";
import { httpContext } from "./helpers.ts";

test("RFC 8414 discovery succeeds", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { rfc8414Status: 200 };
	expect((await new Rfc8414DiscoveryRule().computeScore(ctx)).score).toBe(1);
});
