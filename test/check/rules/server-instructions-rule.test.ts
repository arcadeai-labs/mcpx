import { expect, test } from "bun:test";
import { ServerInstructionsRule } from "../../../src/check/rules/surface/server-instructions-rule.ts";
import { context } from "./helpers.ts";

test("server instructions requires initialize guidance", async () => {
	const result = await new ServerInstructionsRule().computeScore(
		context({ serverInfo: { capabilities: {}, instructions: undefined } }),
	);
	expect(result.score).toBe(0);
});
