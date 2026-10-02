import { expect, test } from "bun:test";
import { ScopesRule } from "../../../src/check/rules/security/scopes-rule.ts";
import { context } from "./helpers.ts";

test("scopes credits advertised OAuth scopes", async () => {
	const result = await new ScopesRule().computeScore(
		context({
			http: { url: "https://example.com", transport: "auto", oauth: { scopesSupported: ["read"] } },
		}),
	);
	expect(result.score).toBe(1);
});
