import { expect, test } from "bun:test";
import { DeclaredCapabilitiesRule } from "../../../src/check/rules/surface/declared-capabilities-rule.ts";
import { context } from "./helpers.ts";

test("declared capabilities penalizes failed list methods", async () => {
	const result = await new DeclaredCapabilitiesRule().computeScore(
		context({
			serverInfo: { capabilities: { tools: {}, resources: {} } },
			capabilityErrors: { resources: "not implemented" },
		}),
	);
	expect(result.score).toBe(0.5);
});
