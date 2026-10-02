import { expect, test } from "bun:test";
import { PrmDiscoveryRule } from "../../../src/check/rules/security/prm-discovery-rule.ts";
import { httpContext } from "./helpers.ts";

test("protected resource metadata is discoverable JSON", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { resourceMetadataStatus: 200, resourceMetadata: {} };
	expect((await new PrmDiscoveryRule().computeScore(ctx)).score).toBe(1);
});
