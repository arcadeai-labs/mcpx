import { expect, test } from "bun:test";
import { DomainValidationRule } from "../../../src/check/rules/security/domain-validation-rule.ts";
import { context } from "./helpers.ts";

test("domain validation honors explicit expected host", async () => {
	const result = await new DomainValidationRule().computeScore(
		context({
			expectedDomain: "example.com",
			http: { url: "https://mcp.example.com", transport: "auto" },
		}),
	);
	expect(result.score).toBe(1);
});
