import { expect, test } from "bun:test";
import { GrantTypesRule } from "../../../src/check/rules/security/grant-types-rule.ts";
import { httpContext } from "./helpers.ts";

test("OAuth supports authorization code and refresh token grants", async () => {
	const ctx = httpContext();
	ctx.http!.oauth = {
		authorizationServerMetadata: { grant_types_supported: ["authorization_code", "refresh_token"] },
	};
	expect((await new GrantTypesRule().computeScore(ctx)).score).toBe(1);
});
