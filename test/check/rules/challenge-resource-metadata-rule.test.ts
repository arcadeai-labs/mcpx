import { expect, test } from "bun:test";
import { ChallengeResourceMetadataRule } from "../../../src/check/rules/security/challenge-resource-metadata-rule.ts";
import { httpContext } from "./helpers.ts";

test("challenge advertises HTTPS resource metadata", async () => {
	const ctx = httpContext();
	ctx.http!.challenge = { params: { resource_metadata: "https://example.com/.well-known/resource" } };
	expect((await new ChallengeResourceMetadataRule().computeScore(ctx)).score).toBe(1);
});
