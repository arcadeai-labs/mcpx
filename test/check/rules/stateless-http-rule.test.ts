import { expect, test } from "bun:test";
import { StatelessHttpRule } from "../../../src/check/rules/protocol/stateless-http-rule.ts";
import { context } from "./helpers.ts";

test("stateless HTTP rejects SSE-only transport", async () => {
	const result = await new StatelessHttpRule().computeScore(
		context({ http: { url: "https://example.com", transport: "sse" } }),
	);
	expect(result.score).toBe(0);
});
