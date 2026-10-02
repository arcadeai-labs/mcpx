import { expect, test } from "bun:test";
import { ClientRegistrationRule } from "../../../src/check/rules/security/client-registration-rule.ts";
import { httpContext } from "./helpers.ts";

test("client registration accepts metadata documents", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = { authorizationServerMetadata: { client_id_metadata_document_supported: true } };
	expect((await new ClientRegistrationRule().computeScore(ctx)).score).toBe(1);
});
