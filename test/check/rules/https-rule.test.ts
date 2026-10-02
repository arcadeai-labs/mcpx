import { expect, test } from "bun:test";
import { HttpsRule } from "../../../src/check/rules/security/https-rule.ts";
import { context } from "./helpers.ts";

test("HTTPS passes secure endpoints", async () => {
	const result = await new HttpsRule().computeScore(
		context({ http: { url: "https://example.com/mcp", transport: "streamable-http" } }),
	);
	expect(result.score).toBe(1);
});
