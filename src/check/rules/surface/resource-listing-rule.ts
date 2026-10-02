import { type CheckContext, QualityRule, type RuleResult, result, skipped } from "../rule.ts";

export class ResourceListingRule extends QualityRule {
	readonly id = "surface.resource-listing";
	readonly category = "surface" as const;
	readonly name = "Resource listing";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const capabilities = context.serverInfo.capabilities as Record<string, unknown> | undefined;
		if (capabilities?.resources === undefined) return skipped("Server does not declare resources");
		if (context.capabilityErrors.resources)
			return result(0, `resources/list failed: ${context.capabilityErrors.resources}`);
		return result(1, `Server returned ${context.resources.length} resources`);
	}
}
