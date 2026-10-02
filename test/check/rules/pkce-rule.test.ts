import { expect, test } from "bun:test";
import { PkceRule } from "../../../src/check/rules/security/pkce-rule.ts";
import { context } from "./helpers.ts";

test("PKCE requires S256", async () => {
	const result = await new PkceRule().computeScore(
		context({
			http: {
				url: "https://example.com",
				transport: "auto",
				oauth: { codeChallengeMethodsSupported: ["S256"] },
			},
		}),
	);
	expect(result.score).toBe(1);
});
