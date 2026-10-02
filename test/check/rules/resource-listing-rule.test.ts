import { expect, test } from "bun:test";
import { ResourceListingRule } from "../../../src/check/rules/surface/resource-listing-rule.ts";
import { context } from "./helpers.ts";

test("resource listing reports successful capability use", async () => {
	const result = await new ResourceListingRule().computeScore(
		context({ serverInfo: { capabilities: { resources: {} } }, resources: [] }),
	);
	expect(result.score).toBe(1);
});
