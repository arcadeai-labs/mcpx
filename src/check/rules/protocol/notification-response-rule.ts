import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class NotificationResponseRule extends QualityRule {
	readonly id = "protocol.notification-response";
	readonly category = "protocol" as const;
	readonly name = "Notification has no JSON-RPC response";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const response = context.http?.notification;
		if (!response) return skipped("Authenticated notification probe was unavailable");
		const valid = [202, 204].includes(response.status) && response.body === undefined;
		return result(valid ? 1 : 0, `Notification returned HTTP ${response.status}`);
	}
}
