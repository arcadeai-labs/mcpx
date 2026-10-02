import { normalizedTokens } from "../helpers/text.ts";
import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class DomainValidationRule extends QualityRule {
	readonly id = "security.domain";
	readonly category = "security" as const;
	readonly name = "Domain validation";
	readonly weight = 3;

	async computeScore(context: CheckContext): Promise<RuleResult> {
		if (!context.http) return skipped("Not applicable to stdio transport");
		const host = new URL(context.http.url).hostname.toLowerCase();
		const expected = context.expectedDomain?.toLowerCase();
		if (expected) {
			const matches = host === expected || host.endsWith(`.${expected}`) || host.includes(expected);
			return result(matches ? 1 : 0, matches ? `${host} matches ${expected}` : `${host} does not match ${expected}`);
		}
		const isIp = /^\d{1,3}(?:\.\d{1,3}){3}$/.test(host) || host.includes(":");
		const candidates = normalizedTokens(context.serverInfo.version?.name ?? context.serverName);
		const matches = candidates.some((token) => host.includes(token));
		return result(
			isIp ? 0 : matches ? 1 : 0.5,
			isIp ? "Endpoint uses a raw IP address" : matches ? "Endpoint host matches server identity" : "Host is valid but identity match is inconclusive",
			"Pass --expect <company-or-host> for an explicit identity check",
		);
	}
}
