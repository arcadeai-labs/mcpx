import { expect, test } from "bun:test";
import { OriginValidationRule } from "../../../src/check/rules/protocol/origin-validation-rule.ts";
import { context } from "./helpers.ts";

test("origin validation credits explicit rejection", async () => {
	const result = await new OriginValidationRule().computeScore(
		context({ http: { url: "https://example.com", transport: "auto", originStatus: 403 } }),
	);
	expect(result.score).toBe(1);
});
