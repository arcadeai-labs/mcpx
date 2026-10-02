import { expect, test } from "bun:test";
import { AuthenticationRule } from "../../../src/check/rules/security/authentication-rule.ts";
import { context } from "./helpers.ts";

test("authentication rejects static API keys", async () => {
	const result = await new AuthenticationRule().computeScore(
		context({
			config: { url: "https://example.com", headers: { "X-API-Key": "secret" } },
			http: { url: "https://example.com", transport: "auto" },
		}),
	);
	expect(result.score).toBe(0);
});
