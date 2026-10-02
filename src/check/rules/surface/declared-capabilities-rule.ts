import { type CheckContext, QualityRule, type RuleResult, result } from "../rule.ts";

export class DeclaredCapabilitiesRule extends QualityRule {
	readonly id = "surface.declared-capabilities";
	readonly category = "surface" as const;
	readonly name = "Declared capability availability";

	async computeScore(context: CheckContext): Promise<RuleResult> {
		const caps = context.serverInfo.capabilities as Record<string, unknown> | undefined;
		const declared = ["tools", "resources", "prompts"].filter((name) => caps?.[name] !== undefined);
		const working = declared.filter((name) => !context.capabilityErrors[name as keyof typeof context.capabilityErrors]);
		const score = declared.length === 0 ? 1 : working.length / declared.length;
		return result(
			score,
			`${working.length}/${declared.length} declared list capabilities responded`,
			"Only declare capabilities whose list methods work",
		);
	}
}
