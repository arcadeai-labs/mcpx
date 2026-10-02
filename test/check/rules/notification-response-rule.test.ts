import { expect, test } from "bun:test";
import { NotificationResponseRule } from "../../../src/check/rules/protocol/notification-response-rule.ts";
import { httpContext } from "./helpers.ts";

test("notifications return no JSON-RPC body", async () => {
	const ctx = httpContext();
	ctx.http!.notification = { status: 202, headers: {} };
	expect((await new NotificationResponseRule().computeScore(ctx)).score).toBe(1);
});
