import { expect, test } from "bun:test";
import { CredentialParametersRule } from "../../../src/check/rules/tool-quality/credential-parameters-rule.ts";
import { context } from "./helpers.ts";

test("credential parameters rejects API keys", async () => {
	const result = await new CredentialParametersRule().computeScore(
		context({
			tools: [{ name: "search", inputSchema: { type: "object", properties: { api_key: { type: "string" } } } }],
		}),
	);
	expect(result.score).toBe(0);
});
